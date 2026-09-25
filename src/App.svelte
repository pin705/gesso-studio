<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './components/Icon.svelte';
  import AssetThumb from './components/AssetThumb.svelte';
  import PixiRuntimeModal from './components/PixiRuntimeModal.svelte';
  import type { AssetControlState, TemplateId } from './types/scene';
  import { DEFAULT_CONTROLS, TEMPLATE_BY_ID, TEMPLATE_META, buildAsset, templateGroups } from './assets';
  import { renderSceneSVG } from './renderer/svg';
  import { SWORD_VARIANTS, buildSwordVariant } from './assets/vfx';
  import { exportJSON, exportPNG, exportPixiDefinition, exportSpriteSheet, exportSVG, exportWebP, serializeAsset } from './export/exporter';
  import { MATERIALS } from './primitives/materials';

  type LibraryTab = 'assets' | 'components' | 'shapes' | 'effects' | 'vfx' | 'text' | 'templates';
  type LibraryFilter = 'all' | 'assets' | 'vfx' | 'templates';

  const duration = 2.8;
  const groups = templateGroups();
  const materialIds = ['jade', 'gold', 'iron', 'paper', 'ink', 'spirit'];
  const elementIds: AssetControlState['element'][] = ['spirit', 'fire', 'ice', 'lightning', 'wind'];
  const rarityIds: AssetControlState['rarity'][] = ['common', 'rare', 'epic', 'legendary'];

  let activeLibraryTab: LibraryTab = 'assets';
  let libraryFilter: LibraryFilter = 'all';
  let search = '';
  let controls: AssetControlState = { ...DEFAULT_CONTROLS };
  let templateId: TemplateId = 'jade-button';
  let selectedNodeId = 'jade-button-shell';
  let currentTime = 0;
  let isPlaying = false;
  let zoom = 0.82;
  let showGrid = true;
  let transparent = false;
  let showSafeArea = true;
  let showRuntime = false;
  let showExport = false;
  let exportBusy = '';
  let toast = '';
  let toastTimer = 0;
  let fps = 60;
  let showJsonPreview = true;

  $: activeMeta = TEMPLATE_BY_ID[templateId];
  $: activeAsset = buildAsset(templateId, controls, currentTime);
  $: renderedSvg = renderSceneSVG(activeAsset, { time: currentTime, selectedId: selectedNodeId, showSelection: true, transparent, title: activeAsset.name });
  $: jsonPreview = serializeAsset(activeAsset, controls);
  $: templateAssets = TEMPLATE_META.map((template) => buildAsset(template.id, { ...controls, templateId: template.id }, 0));
  $: variantAssets = SWORD_VARIANTS.slice(0, 4).map((variant) => buildSwordVariant(variant, controls, 0));
  $: filteredTemplates = TEMPLATE_META.filter((template) => {
    const matchesFilter = libraryFilter === 'all' || template.category === libraryFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${template.name} ${template.description} ${template.id}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });
  $: activeNodeName = selectedNodeId || 'No node selected';

  function flash(message: string): void {
    toast = message;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast = ''), 2600);
  }

  function updateControl<K extends keyof AssetControlState>(key: K, value: AssetControlState[K]): void {
    controls = { ...controls, [key]: value };
  }

  function inputValue(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement).value);
  }

  function inputText(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement).value;
  }

  function selectTemplate(id: TemplateId): void {
    templateId = id;
    controls = { ...controls, templateId: id };
    currentTime = id === 'sword-slash' ? 0.72 : id === 'ink-smoke' ? 0.42 : 0;
    isPlaying = false;
    const selectionMap: Partial<Record<TemplateId, string>> = {
      'jade-button': 'jade-button-shell',
      'gold-button': 'jade-button-shell',
      'cultivation-panel': 'cultivation-panel',
      'skill-icon': 'skill-icon-frame',
      'item-icon': 'item-icon-frame',
      'legendary-badge': 'legendary-badge',
      'sword-slash': 'slash-sword',
      'magic-circle': 'magic-circle-core',
      'ink-smoke': 'ink-smoke-glyph',
      'progress-bar': 'progress-bar',
      'moon-sword': 'moon-sword-frame'
    };
    selectedNodeId = selectionMap[id] ?? '';
  }

  function chooseLibraryTab(tab: LibraryTab): void {
    activeLibraryTab = tab;
    if (tab === 'vfx') libraryFilter = 'vfx';
    else if (tab === 'templates') libraryFilter = 'templates';
    else if (tab === 'assets') libraryFilter = 'assets';
    else libraryFilter = 'all';
  }

  function handleStageClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    const node = target?.closest?.('[data-node-id]') as HTMLElement | null;
    if (node?.dataset.nodeId && !node.dataset.nodeId.startsWith('background-')) selectedNodeId = node.dataset.nodeId;
  }

  function setTimeFromEvent(event: Event): void {
    currentTime = inputValue(event);
  }

  function togglePlay(): void {
    isPlaying = !isPlaying;
  }

  function restart(): void {
    currentTime = 0;
    isPlaying = true;
  }

  function randomizeSeed(): void {
    updateControl('seed', Math.floor(1000 + Math.random() * 8999));
    flash('Seed regenerated · geometry remains reproducible');
  }

  async function handleExport(kind: 'svg' | 'png' | 'webp' | 'json' | 'sprite' | 'pixi'): Promise<void> {
    exportBusy = kind;
    try {
      if (kind === 'svg') exportSVG(activeAsset, { time: currentTime, transparent });
      if (kind === 'png') await exportPNG(activeAsset, { time: currentTime, transparent, scale: 2 });
      if (kind === 'webp') await exportWebP(activeAsset, { time: currentTime, transparent, scale: 2 });
      if (kind === 'json') exportJSON(activeAsset, controls);
      if (kind === 'sprite') await exportSpriteSheet(templateId, controls, { scale: 1, transparent });
      if (kind === 'pixi') exportPixiDefinition(activeAsset, controls);
      flash(`${kind.toUpperCase()} export ready`);
    } catch (cause) {
      flash(cause instanceof Error ? cause.message : 'Export failed');
    } finally {
      exportBusy = '';
    }
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    zoom = Math.min(1.35, Math.max(0.48, zoom + (event.deltaY > 0 ? -0.04 : 0.04)));
  }

  onMount(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (isPlaying) {
        currentTime += delta * controls.speed;
        if (currentTime >= duration) currentTime = 0;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(toastTimer);
    };
  });
</script>

<svelte:head>
  <title>Game Art Studio · Procedural Asset Lab</title>
</svelte:head>

<div class="studio-shell">
  <header class="topbar">
    <div class="brand-lockup">
      <div class="brand-mark"><span></span><span></span><span></span></div>
      <div class="brand-copy"><strong>GAME ART <em>STUDIO</em></strong><small>PROCEDURAL ASSET LAB</small></div>
    </div>
    <div class="project-select"><span class="project-dot"></span><span class="project-name">XIANXIA / UI LAB</span><Icon name="chevron" size={12} /></div>
    <nav class="top-nav" aria-label="Studio sections">
      <button class="active" type="button">DESIGN</button>
      <button type="button" onclick={() => { templateId = 'sword-slash'; controls = { ...controls, templateId: 'sword-slash' }; selectedNodeId = 'slash-sword'; currentTime = 0.72; }}>VFX</button>
      <button type="button" onclick={() => (showExport = true)}>EXPORT</button>
    </nav>
    <div class="top-actions">
      <div class="engine-status"><span></span> ENGINE READY</div>
      <button class="runtime-button" type="button" onclick={() => (showRuntime = true)}><Icon name="bolt" size={13} /> PIXIJS RUNTIME</button>
      <button class="export-button" type="button" onclick={() => (showExport = true)}><Icon name="download" size={14} /> EXPORT ASSET</button>
    </div>
  </header>

  <div class="editor-grid">
    <aside class="left-panel panel-surface">
      <div class="panel-heading"><div><span class="eyebrow">LIBRARY</span><h2>ASSET SHELF</h2></div><button class="small-icon" type="button" aria-label="Add asset" onclick={() => flash('New procedural component queued')}><Icon name="plus" size={14} /></button></div>
      <div class="library-tabs">
        <button class:active={activeLibraryTab === 'assets'} type="button" onclick={() => chooseLibraryTab('assets')}><Icon name="box" size={14} />Assets</button>
        <button class:active={activeLibraryTab === 'components'} type="button" onclick={() => chooseLibraryTab('components')}><Icon name="layers" size={14} />Components</button>
        <button class:active={activeLibraryTab === 'shapes'} type="button" onclick={() => chooseLibraryTab('shapes')}><Icon name="grid" size={14} />Shapes</button>
        <button class:active={activeLibraryTab === 'effects'} type="button" onclick={() => chooseLibraryTab('effects')}><Icon name="effects" size={14} />Effects</button>
        <button class:active={activeLibraryTab === 'vfx'} type="button" onclick={() => chooseLibraryTab('vfx')}><Icon name="spark" size={14} />VFX</button>
        <button class:active={activeLibraryTab === 'text'} type="button" onclick={() => chooseLibraryTab('text')}><Icon name="type" size={14} />Text</button>
        <button class:active={activeLibraryTab === 'templates'} type="button" onclick={() => chooseLibraryTab('templates')}><Icon name="layers" size={14} />Templates</button>
      </div>
      <div class="library-tools">
        <div class="search-box"><Icon name="search" size={13} /><input aria-label="Search assets" placeholder="Search procedural assets" bind:value={search} /></div>
        <div class="filter-pills">
          <button class:active={libraryFilter === 'all'} type="button" onclick={() => (libraryFilter = 'all')}>ALL</button>
          <button class:active={libraryFilter === 'assets'} type="button" onclick={() => (libraryFilter = 'assets')}>ASSETS</button>
          <button class:active={libraryFilter === 'vfx'} type="button" onclick={() => (libraryFilter = 'vfx')}>VFX</button>
        </div>
      </div>

      {#if activeLibraryTab === 'shapes'}
        <div class="primitive-list">
          <div class="primitive-intro">GEOMETRY PRIMITIVES <span>7</span></div>
          {#each ['Rounded rect', 'Circle', 'Ellipse', 'Polygon', 'Star', 'Brush path', 'Energy arc'] as primitive, index}
            <button class="primitive-row" type="button" onclick={() => flash(`${primitive} primitive ready to place`)}><span class="primitive-icon shape-{index}"></span><span>{primitive}</span><Icon name="plus" size={12} /></button>
          {/each}
        </div>
      {:else if activeLibraryTab === 'effects'}
        <div class="primitive-list">
          <div class="primitive-intro">EFFECT STACK <span>8</span></div>
          {#each ['Ink bleed', 'Paper grain', 'Inner bevel', 'Soft glow', 'Edge roughen', 'Mist diffusion', 'Gold shine', 'Particle field'] as effect}
            <button class="primitive-row" type="button" onclick={() => flash(`${effect} effect attached to preview`)}><span class="effect-icon"><Icon name="spark" size={12} /></span><span>{effect}</span><Icon name="plus" size={12} /></button>
          {/each}
        </div>
      {:else if activeLibraryTab === 'text'}
        <div class="primitive-list">
          <div class="primitive-intro">TYPE COMPONENTS <span>4</span></div>
          {#each ['Section title', 'Stat label', 'Seal glyph', 'Vertical inscription'] as textItem}
            <button class="primitive-row" type="button" onclick={() => flash(`${textItem} added to scene`)}><span class="effect-icon"><Icon name="type" size={12} /></span><span>{textItem}</span><Icon name="plus" size={12} /></button>
          {/each}
        </div>
      {:else if activeLibraryTab === 'components'}
        <div class="component-stack">
          <div class="primitive-intro">REUSABLE COMPONENTS <span>12</span></div>
          {#each ['GameButton', 'CultivationPanel', 'SkillIcon', 'ItemIcon', 'LegendaryBadge', 'SwordSlash', 'MagicCircle', 'InkCloud', 'ProgressBar', 'Divider', 'ParticleField', 'Title'] as component}
            <button class="component-row" type="button" onclick={() => flash(`${component} component instantiated`)}><span class="component-dot"></span><span>{component}</span><small>↗</small></button>
          {/each}
        </div>
      {:else}
        <div class="asset-grid">
          {#each filteredTemplates as template (template.id)}
            <AssetThumb asset={templateAssets.find((asset) => asset.id === template.id) ?? activeAsset} selected={template.id === templateId} onSelect={selectTemplate} />
          {/each}
          {#if filteredTemplates.length === 0}<div class="empty-state">No matching procedural assets.<br />Try a different search.</div>{/if}
        </div>
      {/if}

      <div class="current-asset">
        <div class="current-label"><span>ACTIVE SCENE</span><span class="live-dot"></span></div>
        <div class="current-preview">{@html renderSceneSVG(activeAsset, { transparent: true, time: currentTime, title: activeAsset.name })}</div>
        <div class="current-name"><strong>{activeMeta.shortName}</strong><span>{activeAsset.width} × {activeAsset.height}</span></div>
        <div class="current-meta"><span>v{activeAsset.version}.0</span><span>seed {activeAsset.seed}</span><span>{activeAsset.nodes.length} nodes</span></div>
      </div>
    </aside>

    <main class="center-panel">
      <div class="canvas-toolbar">
        <div class="scene-breadcrumb"><span>SCENE</span><b>/</b><strong>{activeMeta.shortName.toUpperCase()}</strong><span class="dirty-dot"></span></div>
        <div class="canvas-tools">
          <button class:active={showGrid} type="button" aria-label="Toggle grid" onclick={() => (showGrid = !showGrid)}><Icon name="grid" size={13} /> GRID</button>
          <button class:active={showSafeArea} type="button" aria-label="Toggle safe area" onclick={() => (showSafeArea = !showSafeArea)}><Icon name="target" size={13} /> SAFE</button>
          <button class:active={transparent} type="button" aria-label="Toggle transparency" onclick={() => (transparent = !transparent)}><Icon name="eye" size={13} /> ALPHA</button>
          <span class="tool-divider"></span>
          <button type="button" aria-label="Zoom out" onclick={() => (zoom = Math.max(0.48, zoom - 0.08))}>−</button>
          <span class="zoom-value">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" onclick={() => (zoom = Math.min(1.35, zoom + 0.08))}>+</button>
        </div>
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div class:grid-visible={showGrid} class:alpha-mode={transparent} class="stage-viewport" onwheel={onWheel} onclick={handleStageClick} onkeydown={(event) => event.key === 'Escape' && (selectedNodeId = '')} tabindex="0" role="application" aria-label="Procedural asset canvas">
        <div class="ruler ruler-top"><span>0</span><span>120</span><span>240</span><span>360</span><span>480</span><span>600</span><span>720</span></div>
        <div class="ruler ruler-left"><span>0</span><span>120</span><span>240</span><span>360</span><span>480</span></div>
        <div class="stage-crosshair"></div>
        <div class="artboard-scale" style={`transform: translate(-50%, -50%) scale(${zoom})`}>
          <div class:transparent-art={transparent} class="artboard" style={`--art-accent: ${activeMeta.accent}`}>
            {@html renderedSvg}
            {#if showSafeArea}<div class="safe-area"></div>{/if}
          </div>
          <div class="artboard-tag"><span class="tag-dot"></span> {activeMeta.shortName.toUpperCase()} <i>·</i> {activeAsset.width} × {activeAsset.height}</div>
        </div>
        <div class="viewport-hint"><span class="mouse-icon">↖</span> DRAG TO PAN <i>·</i> SCROLL TO ZOOM</div>
        <div class="viewport-coordinates">X 360 <i>·</i> Y 240</div>
      </div>
      <div class="variation-dock">
        <div class="variation-heading"><div><span class="eyebrow">PROCEDURAL VARIATION</span><strong>ONE RECIPE <i>→</i> MANY ASSETS</strong></div><button type="button" onclick={() => { templateId = 'moon-sword'; controls = { ...controls, templateId: 'moon-sword' }; selectedNodeId = 'moon-sword-frame'; }}>OPEN MATRIX <Icon name="chevron" size={12} /></button></div>
        <div class="variant-row">
          {#each variantAssets as variant, index}
            <button class="variant-card" class:chosen={templateId === 'moon-sword' && index === 0} type="button" onclick={() => { templateId = 'moon-sword'; controls = { ...controls, templateId: 'moon-sword', rarity: SWORD_VARIANTS[index].rarity, material: SWORD_VARIANTS[index].guard }; selectedNodeId = 'moon-sword-frame'; }}>
              <div class="variant-art">{@html renderSceneSVG(variant, { transparent: true, time: currentTime * 0.35, title: variant.name })}</div>
              <div class="variant-label"><span>{SWORD_VARIANTS[index].blade}</span><small>{SWORD_VARIANTS[index].guard} / {SWORD_VARIANTS[index].ornament}</small></div>
            </button>
          {/each}
          <div class="variant-plus"><Icon name="plus" size={15} /><span>GENERATE<br />MORE</span></div>
        </div>
      </div>
    </main>

    <aside class="right-panel panel-surface">
      <div class="inspector-header"><div><span class="eyebrow">PROPERTIES</span><h2>INSPECTOR</h2></div><div class="inspector-actions"><button class="small-icon" type="button" aria-label="Toggle visibility" onclick={() => flash('Visibility is inherited by the scene node')}><Icon name="eye" size={14} /></button><button class="small-icon" type="button" aria-label="Lock node" onclick={() => flash('Node lock toggled')}><Icon name="lock" size={13} /></button></div></div>
      <div class="selection-summary"><div class="selection-icon"><Icon name={templateId.includes('slash') || templateId.includes('smoke') ? 'spark' : templateId === 'cultivation-panel' ? 'layers' : 'box'} size={15} /></div><div><strong>{activeNodeName}</strong><small>{selectedNodeId || 'scene root'} <i>·</i> SVG NODE</small></div><span class="selected-state">SELECTED</span></div>
      <div class="inspector-scroll">
        <section class="inspector-section open">
          <div class="section-title"><span>TRANSFORM</span><button type="button" aria-label="Reset transform" onclick={() => flash('Transform reset to authored value')}><Icon name="restart" size={12} /></button></div>
          <div class="field-grid four">
            <label><span>X</span><input value="360" readonly /></label><label><span>Y</span><input value="240" readonly /></label><label><span>W</span><input value={activeAsset.width} readonly /></label><label><span>H</span><input value={activeAsset.height} readonly /></label>
          </div>
          <div class="field-grid two"><label><span>ROT</span><input value="0°" readonly /></label><label><span>SCALE</span><input value="100%" readonly /></label></div>
        </section>

        <section class="inspector-section open">
          <div class="section-title"><span>STYLE / MATERIAL</span><button type="button" onclick={() => (showJsonPreview = !showJsonPreview)}><Icon name="code" size={12} /></button></div>
          <div class="material-grid">
            {#each materialIds as material}
              <button class:chosen={controls.material === material} type="button" onclick={() => updateControl('material', material)}><span class="material-swatch {material}"></span><small>{MATERIALS[material]?.label ?? material}</small></button>
            {/each}
          </div>
          <div class="inline-label"><span>RARITY</span><span class="rarity-value {controls.rarity}">{controls.rarity}</span></div>
          <div class="rarity-row">
            {#each rarityIds as rarity}<button class:active={controls.rarity === rarity} class="rarity-button {rarity}" type="button" onclick={() => updateControl('rarity', rarity)}>{rarity}</button>{/each}
          </div>
          <label class="wide-field"><span>DISPLAY LABEL</span><input value={controls.label} oninput={(event) => updateControl('label', inputText(event))} /></label>
        </section>

        <section class="inspector-section open">
          <div class="section-title"><span>PROCEDURAL PROPERTIES</span><span class="deterministic"><i></i> DETERMINISTIC</span></div>
          <label class="range-field"><span><b>Seed</b><output>{controls.seed}</output></span><input type="range" min="1" max="9999" step="1" value={controls.seed} oninput={(event) => updateControl('seed', inputValue(event))} /></label>
          <label class="range-field"><span><b>Edge roughness</b><output>{Math.round(controls.roughness * 100)}%</output></span><input type="range" min="0" max="1" step="0.01" value={controls.roughness} oninput={(event) => updateControl('roughness', inputValue(event))} /></label>
          <label class="range-field"><span><b>Inner glow</b><output>{Math.round(controls.glow * 100)}%</output></span><input type="range" min="0" max="1" step="0.01" value={controls.glow} oninput={(event) => updateControl('glow', inputValue(event))} /></label>
          <label class="range-field"><span><b>Opacity</b><output>{Math.round(controls.opacity * 100)}%</output></span><input type="range" min="0.1" max="1" step="0.01" value={controls.opacity} oninput={(event) => updateControl('opacity', inputValue(event))} /></label>
        </section>

        <section class="inspector-section render-stack-section">
          <div class="section-title"><span>RENDER STACK</span><span class="section-count">LIVE</span></div>
          <div class="render-stack">
            {#each ['MATERIAL', 'FILL', 'GRADIENT', 'STROKE', 'SHADOW', 'GLOW', 'BLUR', 'INK BLEED', 'MASK'] as stackItem, index}
              <button class:active={index < 7} type="button" onclick={() => flash(`${stackItem} layer is procedural`)}><span class="stack-led {index < 7 ? 'on' : ''}"></span><span>{stackItem}</span><Icon name="check" size={10} /></button>
            {/each}
          </div>
        </section>

        <section class="inspector-section open">
          <div class="section-title"><span>ELEMENT / VFX</span><span class="section-count">{templateId === 'sword-slash' || templateId === 'ink-smoke' ? 'ACTIVE' : 'READY'}</span></div>
          <div class="element-row">
            {#each elementIds as element}<button class:active={controls.element === element} type="button" onclick={() => updateControl('element', element)}><span class="element-dot {element}"></span>{element}</button>{/each}
          </div>
          <label class="range-field"><span><b>Particle density</b><output>{controls.particleCount}</output></span><input type="range" min="8" max="120" step="1" value={controls.particleCount} oninput={(event) => updateControl('particleCount', inputValue(event))} /></label>
          <label class="range-field"><span><b>Distortion</b><output>{Math.round(controls.intensity * 100)}%</output></span><input type="range" min="0" max="1" step="0.01" value={controls.intensity} oninput={(event) => updateControl('intensity', inputValue(event))} /></label>
          <label class="range-field"><span><b>Playback speed</b><output>{controls.speed.toFixed(1)}×</output></span><input type="range" min="0.25" max="2" step="0.05" value={controls.speed} oninput={(event) => updateControl('speed', inputValue(event))} /></label>
        </section>

        <section class="inspector-section json-section">
          <button class="section-title clickable" type="button" onclick={() => (showJsonPreview = !showJsonPreview)}><span>SCENE DEFINITION</span><span class="section-count">JSON <Icon name="chevron" size={11} /></span></button>
          {#if showJsonPreview}<div class="json-preview"><pre>{jsonPreview.slice(0, 520)}{jsonPreview.length > 520 ? '\n…' : ''}</pre><button type="button" onclick={() => { navigator.clipboard?.writeText(jsonPreview); flash('Scene JSON copied'); }}>COPY JSON</button></div>{/if}
        </section>
      </div>
      <div class="inspector-footer"><button class="secondary-action" type="button" onclick={randomizeSeed}><Icon name="restart" size={13} /> RANDOMIZE SEED</button><button class="primary-action" type="button" onclick={() => (showExport = true)}><Icon name="download" size={13} /> EXPORT</button></div>
    </aside>
  </div>

  <footer class="timeline-bar">
    <div class="timeline-top"><div class="timeline-title"><span class="eyebrow">MOTION</span><strong>TIMELINE</strong><span class="timeline-duration">LOOP · {duration.toFixed(1)}s</span></div><div class="timeline-actions"><button class="timeline-icon" type="button" aria-label="Restart" onclick={restart}><Icon name="restart" size={13} /></button><button class="play-button" class:playing={isPlaying} type="button" aria-label={isPlaying ? 'Pause' : 'Play'} onclick={togglePlay}><Icon name={isPlaying ? 'pause' : 'play'} size={14} /></button><span class="time-readout">{currentTime.toFixed(2)} <i>/</i> {duration.toFixed(2)}s</span><label class="fps-control">FPS <select bind:value={fps}><option value={24}>24</option><option value={30}>30</option><option value={60}>60</option></select></label></div></div>
    <div class="timeline-body">
      <div class="track-labels"><div class="track-label active"><span class="track-color violet"></span><span>Scene entrance</span><small>0.0s</small></div><div class="track-label"><span class="track-color coral"></span><span>Ink bleed</span><small>0.2s</small></div><div class="track-label"><span class="track-color mint"></span><span>Particle emission</span><small>0.4s</small></div><div class="track-label"><span class="track-color gold"></span><span>Path progress</span><small>1.5s</small></div></div>
      <div class="timeline-ruler"><span>0:00</span><span>0:35</span><span>1:10</span><span>1:45</span><span>2:20</span><span>2:48</span></div>
      <div class="track-canvas" role="slider" tabindex="0" aria-label="Timeline position" aria-valuenow={currentTime} aria-valuemin="0" aria-valuemax={duration} onkeydown={(event) => { if (event.key === 'ArrowRight') currentTime = Math.min(duration, currentTime + 0.05); if (event.key === 'ArrowLeft') currentTime = Math.max(0, currentTime - 0.05); }} onclick={(event) => { const target = event.currentTarget as HTMLElement; const rect = target.getBoundingClientRect(); currentTime = Math.max(0, Math.min(duration, ((event.clientX - rect.left) / rect.width) * duration)); }}>
        <div class="track-row"><div class="track-block scene-block"></div><i class="keyframe" style="left: 5%"></i><i class="keyframe" style="left: 70%"></i><i class="keyframe" style="left: 93%"></i></div>
        <div class="track-row"><div class="track-block ink-block"></div><i class="keyframe" style="left: 9%"></i><i class="keyframe" style="left: 35%"></i><i class="keyframe" style="left: 82%"></i></div>
        <div class="track-row"><div class="track-block particle-block"></div><i class="keyframe" style="left: 16%"></i><i class="keyframe" style="left: 45%"></i><i class="keyframe" style="left: 78%"></i></div>
        <div class="track-row"><div class="track-block path-block"></div><i class="keyframe" style="left: 0%"></i><i class="keyframe" style="left: 55%"></i><i class="keyframe" style="left: 86%"></i></div>
        <div class="playhead" style={`left: ${(currentTime / duration) * 100}%`}><span></span></div>
      </div>
    </div>
    <input class="timeline-scrubber" type="range" min="0" max={duration} step="0.01" value={currentTime} aria-label="Timeline position" oninput={setTimeFromEvent} />
  </footer>
</div>

{#if showRuntime}
  <PixiRuntimeModal asset={activeAsset} open={showRuntime} onClose={() => (showRuntime = false)} />
{/if}

{#if showExport}
  <div class="export-backdrop" role="presentation" onclick={(event) => event.currentTarget === event.target && (showExport = false)}>
    <div class="export-modal" role="dialog" aria-modal="true" aria-label="Export procedural asset">
      <header class="export-header"><div><span class="eyebrow">OUTPUT PIPELINE</span><h2>EXPORT <em>{activeMeta.shortName.toUpperCase()}</em></h2></div><button class="small-icon" type="button" aria-label="Close export dialog" onclick={() => (showExport = false)}><Icon name="close" size={15} /></button></header>
      <div class="export-body">
        <div class="export-summary"><div class="export-preview">{@html renderSceneSVG(activeAsset, { transparent: true, time: currentTime, title: activeAsset.name })}</div><div><span class="eyebrow">CURRENT FRAME</span><strong>{activeAsset.width} × {activeAsset.height}</strong><small>{activeAsset.nodes.length} declarative nodes · seed {activeAsset.seed}</small></div></div>
        <div class="export-actions">
          <button type="button" onclick={() => handleExport('svg')}><span class="export-icon"><Icon name="code" size={17} /></span><span><b>SVG</b><small>Vector · editable</small></span><em>{exportBusy === 'svg' ? '…' : '↗'}</em></button>
          <button type="button" onclick={() => handleExport('png')}><span class="export-icon"><Icon name="download" size={17} /></span><span><b>PNG</b><small>2× raster · alpha</small></span><em>{exportBusy === 'png' ? '…' : '↗'}</em></button>
          <button type="button" onclick={() => handleExport('webp')}><span class="export-icon"><Icon name="spark" size={17} /></span><span><b>WEBP</b><small>Optimized raster</small></span><em>{exportBusy === 'webp' ? '…' : '↗'}</em></button>
          <button type="button" onclick={() => handleExport('json')}><span class="export-icon"><Icon name="layers" size={17} /></span><span><b>JSON</b><small>Scene definition</small></span><em>{exportBusy === 'json' ? '…' : '↗'}</em></button>
          <button type="button" onclick={() => handleExport('sprite')}><span class="export-icon"><Icon name="grid" size={17} /></span><span><b>SPRITE SHEET</b><small>6 procedural frames</small></span><em>{exportBusy === 'sprite' ? '…' : '↗'}</em></button>
          <button type="button" onclick={() => handleExport('pixi')}><span class="export-icon"><Icon name="bolt" size={17} /></span><span><b>PIXIJS DEF</b><small>Runtime manifest</small></span><em>{exportBusy === 'pixi' ? '…' : '↗'}</em></button>
        </div>
        <div class="export-json-head"><span>SCENE JSON PREVIEW</span><button type="button" onclick={() => { navigator.clipboard?.writeText(jsonPreview); flash('Scene JSON copied'); }}>COPY</button></div>
        <pre class="export-json">{jsonPreview.slice(0, 2300)}{jsonPreview.length > 2300 ? '\n…' : ''}</pre>
      </div>
      <footer class="export-footer"><span><i></i> Every export is generated locally in your browser.</span><button type="button" onclick={() => (showRuntime = true)}>PREVIEW IN PIXIJS <Icon name="chevron" size={12} /></button></footer>
    </div>
  </div>
{/if}

{#if toast}<div class="toast"><span></span>{toast}</div>{/if}
