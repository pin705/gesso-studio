<script lang="ts">
  import { onMount } from 'svelte';
  import { Application } from 'pixi.js';
  import type { AssetDefinition } from '../types/scene';
  import { createPixiAsset } from '../renderer/pixi';
  import Icon from './Icon.svelte';

  export let asset: AssetDefinition;
  export let open = false;
  export let onClose: () => void = () => undefined;

  let host: HTMLDivElement;
  let error = '';
  let runtimeStatus = 'booting';

  onMount(() => {
    let disposed = false;
    let app: Application | null = null;
    let runtime: ReturnType<typeof createPixiAsset> | null = null;

    const boot = async () => {
      try {
        runtimeStatus = 'initializing WebGL';
        app = new Application();
        await app.init({
          width: asset.width,
          height: asset.height,
          background: '#0a1015',
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2)
        });
        if (disposed || !app) {
          app.destroy(true, { children: true });
          return;
        }
        host.appendChild(app.canvas);
        runtime = createPixiAsset(asset, { duration: 2.8 });
        app.stage.addChild(runtime);
        runtime.play();
        runtimeStatus = 'playing · deterministic time';
      } catch (cause) {
        error = cause instanceof Error ? cause.message : 'Pixi runtime could not start';
        runtimeStatus = 'unavailable';
      }
    };

    void boot();
    return () => {
      disposed = true;
      runtime?.destroy({ children: true });
      if (app) app.destroy(true, { children: true });
    };
  });
</script>

{#if open}
  <div class="modal-backdrop" role="presentation" onclick={(event) => event.currentTarget === event.target && onClose()}>
    <div class="pixi-modal" role="dialog" aria-modal="true" aria-label="Pixi runtime preview">
      <header>
        <div class="modal-title"><span class="runtime-pulse"></span><div><strong>PIXIJS RUNTIME</strong><small>same scene definition · WebGL canvas</small></div></div>
        <button class="icon-button" type="button" aria-label="Close runtime preview" onclick={onClose}><Icon name="close" size={16} /></button>
      </header>
      <div class="runtime-stage" bind:this={host}></div>
      <footer>
        <div class="runtime-meta"><span class="status-dot"></span><span>{runtimeStatus}</span><span class="divider"></span><span>{asset.nodes.length} nodes</span><span class="divider"></span><span>seed {asset.seed}</span></div>
        <code>createPixiAsset(asset).play()</code>
      </footer>
      {#if error}<p class="error">{error}</p>{/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 32px; background: rgba(2, 5, 8, .78); backdrop-filter: blur(8px); }
  .pixi-modal { width: min(780px, 100%); border: 1px solid rgba(113,229,208,.24); border-radius: 12px; overflow: hidden; background: #0a1015; box-shadow: 0 30px 90px rgba(0,0,0,.6), 0 0 50px rgba(70,198,173,.08); }
  header, footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
  header { border-bottom: 1px solid rgba(126,169,162,.14); }
  footer { border-top: 1px solid rgba(126,169,162,.14); color: #718d89; font: 10px ui-monospace, monospace; letter-spacing: .4px; }
  .modal-title { display: flex; gap: 10px; align-items: center; }
  .modal-title strong { display: block; color: #b7eee0; font: 700 10px ui-monospace, monospace; letter-spacing: 1.8px; }
  .modal-title small { display: block; margin-top: 4px; color: #607773; font: 10px ui-monospace, monospace; }
  .runtime-pulse { width: 8px; height: 8px; border-radius: 50%; background: #71e5d0; box-shadow: 0 0 13px #71e5d0; }
  .icon-button { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid rgba(126,169,162,.2); border-radius: 5px; color: #90aaa3; background: transparent; cursor: pointer; }
  .icon-button:hover { color: #d6fff4; border-color: #71e5d0; }
  .runtime-stage { display: grid; place-items: center; min-height: 420px; padding: 18px; background: radial-gradient(circle at 50% 45%, #142329, #080d12 72%); }
  .runtime-stage :global(canvas) { display: block; width: min(720px, 100%); height: auto; border: 1px solid rgba(112,169,158,.18); }
  .runtime-meta { display: flex; align-items: center; gap: 9px; }
  .status-dot { width: 5px; height: 5px; border-radius: 50%; background: #71e5d0; }
  .divider { width: 1px; height: 11px; background: #304541; }
  code { color: #6eaaa0; font: 10px ui-monospace, monospace; }
  .error { margin: 0; padding: 0 16px 14px; color: #f19b8e; font: 11px ui-monospace, monospace; }
</style>
