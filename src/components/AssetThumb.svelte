<script lang="ts">
  import type { AssetDefinition, TemplateId } from '../types/scene';
  import { renderSceneSVG } from '../renderer/svg';

  export let asset: AssetDefinition;
  export let selected = false;
  export let compact = false;
  export let onSelect: (id: TemplateId) => void = () => undefined;

  $: markup = renderSceneSVG(asset, { transparent: true, forExport: true, title: asset.name });
</script>

<button class:compact class:selected class="asset-thumb" type="button" aria-label={`Open ${asset.name}`} onclick={() => onSelect(asset.id as TemplateId)}>
  <div class="thumb-art" aria-hidden="true">{@html markup}</div>
  <div class="thumb-sheen"></div>
  {#if selected}<span class="selected-dot"></span>{/if}
</button>

<style>
  .asset-thumb { position: relative; display: block; width: 100%; padding: 0; border: 1px solid rgba(125, 163, 159, .16); border-radius: 7px; overflow: hidden; background: #0c1318; cursor: pointer; transition: border-color .18s ease, transform .18s ease, box-shadow .18s ease; }
  .asset-thumb:hover { border-color: rgba(113, 229, 208, .48); transform: translateY(-1px); box-shadow: 0 8px 18px rgba(0,0,0,.24); }
  .asset-thumb.selected { border-color: #67d8c3; box-shadow: 0 0 0 1px rgba(103,216,195,.22), 0 0 22px rgba(69, 205, 179, .12); }
  .thumb-art { width: 100%; aspect-ratio: 1.5; overflow: hidden; background: radial-gradient(circle at 50% 48%, rgba(55, 111, 103, .24), transparent 68%), #101b20; }
  .thumb-art :global(svg) { display: block; width: 100%; height: 100%; }
  .thumb-sheen { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,.06) 48%, transparent 60%); opacity: .45; }
  .selected-dot { position: absolute; top: 6px; right: 6px; width: 5px; height: 5px; border-radius: 50%; background: #71e5d0; box-shadow: 0 0 9px #71e5d0; }
  .compact .thumb-art { aspect-ratio: 1.72; }
</style>
