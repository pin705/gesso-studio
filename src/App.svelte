<script lang="ts">
  import Icon from './components/Icon.svelte';

  interface Asset {
    id: string;
    file: string;
    mtime: number;
    type: string;
    style: string;
    width: number;
    height: number;
    duration: number;
    nineSlice: number[] | null;
  }
  interface Project {
    name: string;
    dir: string;
    server: string;
    artBible: string | null;
    assets: Asset[];
  }

  const TYPES = ['button', 'panel', 'frame', 'bar', 'icon', 'vfx', 'background', 'other'];
  const BACKDROPS = ['checker', 'dark', 'light'] as const;
  const ZOOMS = [0, 1, 2];

  let project = $state<Project | null>(null);
  let offline = $state(false);
  let selectedId = $state(decodeURIComponent(location.hash.slice(1)));
  let backdrop = $state<(typeof BACKDROPS)[number]>('checker');
  let zoom = $state(0);
  let grayscale = $state(false);
  let guides = $state(true);
  let drawer = $state<'' | 'bible' | 'connect'>('');
  let playing = $state(true);
  let time = $state(0);
  let stageWidth = $state(0);
  let stageHeight = $state(0);
  let viewer = $state<HTMLObjectElement>();
  let lastPayload = '';

  async function refresh(): Promise<void> {
    try {
      const payload = await (await fetch('/api/project')).text();
      offline = false;
      if (payload !== lastPayload) {
        lastPayload = payload;
        project = JSON.parse(payload);
      }
    } catch {
      offline = true;
    }
  }

  $effect(() => {
    refresh();
    // ponytail: 1s polling of a local endpoint; move to fs.watch + SSE if projects reach thousands of files
    const timer = setInterval(refresh, 1000);
    const onHash = () => (selectedId = decodeURIComponent(location.hash.slice(1)));
    addEventListener('hashchange', onHash);
    return () => {
      clearInterval(timer);
      removeEventListener('hashchange', onHash);
    };
  });

  const assets = $derived(project?.assets ?? []);
  const selected = $derived(assets.find((asset) => asset.id === selectedId) ?? assets[0]);
  const groups = $derived(
    TYPES.map((type) => ({ type, items: assets.filter((asset) => (TYPES.includes(asset.type) ? asset.type : 'other') === type) })).filter((group) => group.items.length)
  );
  const palette = $derived([...new Set(project?.artBible?.match(/#[0-9a-f]{6}\b/gi) ?? [])]);
  const scale = $derived(selected ? zoom || Math.max(0.1, Math.min(4, (stageWidth - 96) / selected.width, (stageHeight - 96) / selected.height)) : 1);
  const setup = $derived(
    project && {
      claude: `claude mcp add game-art -e GAME_ART_PROJECT="${project.dir}" -- node "${project.server}"`,
      codex: `[mcp_servers.game-art]\ncommand = "node"\nargs = ["${project.server}"]\nenv = { GAME_ART_PROJECT = "${project.dir}" }`,
      json: JSON.stringify({ mcpServers: { 'game-art': { command: 'node', args: [project.server], env: { GAME_ART_PROJECT: project.dir } } } }, null, 2)
    }
  );

  const url = (asset: Asset) => `/files/${asset.file}?v=${asset.mtime}`;

  function select(id: string): void {
    location.hash = encodeURIComponent(id);
    playing = true;
    time = 0;
  }

  function content() {
    const document = viewer?.contentDocument;
    return { svg: document?.documentElement as unknown as SVGSVGElement | undefined, css: document?.getAnimations?.() ?? [] };
  }

  function prepare(): void {
    const { svg } = content();
    svg?.setAttribute('width', '100%');
    svg?.setAttribute('height', '100%');
    if (!playing) seek(time);
  }

  function seek(seconds: number): void {
    time = seconds;
    playing = false;
    const { svg, css } = content();
    svg?.pauseAnimations?.();
    svg?.setCurrentTime?.(seconds);
    for (const animation of css) {
      animation.pause();
      animation.currentTime = seconds * 1000;
    }
  }

  function togglePlay(): void {
    const { svg, css } = content();
    playing = !playing;
    if (playing) {
      svg?.unpauseAnimations?.();
      for (const animation of css) animation.play();
    } else {
      svg?.pauseAnimations?.();
      for (const animation of css) animation.pause();
      time = (svg?.getCurrentTime?.() ?? 0) % (selected?.duration || 1);
    }
  }

  async function downloadPng(asset: Asset, factor: number): Promise<void> {
    const image = new Image();
    image.src = url(asset);
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(asset.width * factor);
    canvas.height = Math.ceil(asset.height * factor);
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${asset.id}${factor === 1 ? '' : `@${factor}x`}.png`;
    link.click();
  }
</script>

{#snippet connectGuide()}
  {#if setup}
    <p>The studio only shows what your AI makes. Connect any MCP-capable agent to this project, then ask it for art.</p>
    <h4>Claude Code</h4>
    <pre>{setup.claude}</pre>
    <h4>Codex <small>~/.codex/config.toml</small></h4>
    <pre>{setup.codex}</pre>
    <h4>Cursor, Claude Desktop, Windsurf… <small>mcpServers JSON</small></h4>
    <pre>{setup.json}</pre>
    <h4>Then try</h4>
    <p class="prompt">“Read the game-art project, propose an art bible for my cozy farming game, then make the main menu buttons.”</p>
  {/if}
{/snippet}

<div class="app">
  <header class="topbar">
    <div class="brand"><span class="mark" aria-hidden="true"></span><strong>Game Art Studio</strong></div>
    {#if project}
      <span class="crumb">{project.name}</span>
      <span class="meta">{assets.length} asset{assets.length === 1 ? '' : 's'}</span>
    {/if}
    <span class="status" class:off={offline}><i></i>{offline ? 'offline' : 'live'}</span>
    <nav>
      <button class:active={drawer === 'bible'} onclick={() => (drawer = drawer === 'bible' ? '' : 'bible')}><Icon name="brush" size={14} /> Art bible</button>
      <button class:active={drawer === 'connect'} onclick={() => (drawer = drawer === 'connect' ? '' : 'connect')}><Icon name="bolt" size={14} /> Connect AI</button>
    </nav>
  </header>

  {#if project && !assets.length}
    <main class="empty">
      <div class="card">
        <h1>No art yet</h1>
        {@render connectGuide()}
      </div>
    </main>
  {:else}
    <div class="workspace">
      <aside class="shelf">
        {#each groups as group (group.type)}
          <section>
            <h3>{group.type}<span>{group.items.length}</span></h3>
            <div class="thumbs">
              {#each group.items as asset (asset.id)}
                <button class="thumb" class:selected={asset.id === selected?.id} onclick={() => select(asset.id)} title={asset.id}>
                  <span class="thumb-art"><img src={url(asset)} alt="" loading="lazy" /></span>
                  <span class="thumb-name">{asset.id}</span>
                </button>
              {/each}
            </div>
          </section>
        {/each}
      </aside>

      <main class="stage">
        {#if selected}
          <div class="toolbar">
            <div class="segmented">
              {#each BACKDROPS as option (option)}<button class:active={backdrop === option} onclick={() => (backdrop = option)}>{option}</button>{/each}
            </div>
            <div class="segmented">
              {#each ZOOMS as option (option)}<button class:active={zoom === option} onclick={() => (zoom = option)}>{option ? `${option}×` : 'fit'}</button>{/each}
            </div>
            <button class="toggle" class:active={grayscale} onclick={() => (grayscale = !grayscale)} title="Grayscale value check"><Icon name="eye" size={13} /> values</button>
            {#if selected.nineSlice}
              <button class="toggle" class:active={guides} onclick={() => (guides = !guides)} title="9-slice guides"><Icon name="grid" size={13} /> 9-slice</button>
            {/if}
            <span class="zoom">{Math.round(scale * 100)}%</span>
          </div>
          <div class="canvas {backdrop}" bind:clientWidth={stageWidth} bind:clientHeight={stageHeight}>
            <div class="art" style:width="{selected.width * scale}px" style:height="{selected.height * scale}px">
              {#key url(selected)}
                <object bind:this={viewer} data={url(selected)} type="image/svg+xml" title={selected.id} class:gray={grayscale} onload={prepare}></object>
              {/key}
              {#if guides && selected.nineSlice}
                {@const [top, right, bottom, left] = selected.nineSlice}
                <i class="guide h" style:top="{top * scale}px"></i>
                <i class="guide h" style:bottom="{bottom * scale}px"></i>
                <i class="guide v" style:left="{left * scale}px"></i>
                <i class="guide v" style:right="{right * scale}px"></i>
              {/if}
            </div>
          </div>
          {#if selected.duration}
            <div class="timeline">
              <button onclick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}><Icon name={playing ? 'pause' : 'play'} size={14} /></button>
              <input type="range" min="0" max={selected.duration} step="0.01" value={time} aria-label="Scrub animation" oninput={(event) => seek(Number(event.currentTarget.value))} />
              <span>{time.toFixed(2)} / {selected.duration.toFixed(2)}s</span>
            </div>
          {/if}
        {:else if offline}
          <p class="notice">The studio server is not reachable. Start it with your AI agent (MCP) or <code>npm run dev</code>.</p>
        {/if}
      </main>

      <aside class="inspector">
        {#if selected}
          <h2>{selected.id}</h2>
          <dl>
            <dt>Type</dt><dd>{selected.type}</dd>
            {#if selected.style}<dt>Style</dt><dd>{selected.style}</dd>{/if}
            <dt>Size</dt><dd>{selected.width} × {selected.height}</dd>
            {#if selected.nineSlice}<dt>9-slice</dt><dd>{selected.nineSlice.join(' · ')}</dd>{/if}
            {#if selected.duration}<dt>Duration</dt><dd>{selected.duration}s</dd>{/if}
            <dt>File</dt><dd class="path">{selected.file}</dd>
          </dl>
          <div class="downloads">
            <a class="button" href={url(selected)} download="{selected.id}.svg"><Icon name="code" size={13} /> SVG</a>
            <button onclick={() => downloadPng(selected, 1)}><Icon name="download" size={13} /> PNG</button>
            <button onclick={() => downloadPng(selected, 2)}><Icon name="download" size={13} /> @2x</button>
          </div>
          <p class="hint">Want changes, states or variants? Ask your AI about <b>{selected.id}</b>; this view updates as it works.</p>
        {/if}
      </aside>
    </div>
  {/if}

  {#if drawer}
    <div class="drawer-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && (drawer = '')}>
      <section class="drawer" aria-label={drawer === 'bible' ? 'Art bible' : 'Connect AI'}>
        <header>
          <h2>{drawer === 'bible' ? 'Art bible' : 'Connect your AI'}</h2>
          <button class="icon" aria-label="Close" onclick={() => (drawer = '')}><Icon name="close" size={15} /></button>
        </header>
        {#if drawer === 'connect'}
          {@render connectGuide()}
        {:else if project?.artBible}
          {#if palette.length}
            <div class="palette">{#each palette as color (color)}<span style:background={color} title={color}></span>{/each}</div>
          {/if}
          <pre class="bible">{project.artBible}</pre>
        {:else}
          <p>No STYLE.md yet. Ask your AI to create the art bible first; every asset follows it.</p>
        {/if}
      </section>
    </div>
  {/if}
</div>
