<script lang="ts">
  export let name = 'spark';
  export let size = 16;
  export let stroke = 'currentColor';
  export let strokeWidth = 1.6;
</script>

<svg class="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke={stroke} stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round">
  {#if name === 'spark'}
    <path d="M12 2.8 13.7 9l5.8 2-5.8 2-1.7 6.2L10.3 13 4.5 11l5.8-2L12 2.8Z" fill="currentColor" stroke="none" />
    <path d="m19 3 .6 2.4L22 6l-2.4.6L19 9l-.6-2.4L16 6l2.4-.6L19 3Z" fill="currentColor" stroke="none" opacity=".6" />
  {:else if name === 'layers'}
    <path d="m12 3 8.5 4.6L12 12 3.5 7.6 12 3Z" /><path d="m4 12 8 4.3 8-4.3M4 16.5l8 4.3 8-4.3" />
  {:else if name === 'box'}
    <path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" />
  {:else if name === 'sliders'}
    <path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" fill="var(--panel-2)" /><circle cx="15" cy="12" r="2" fill="var(--panel-2)" /><circle cx="11" cy="18" r="2" fill="var(--panel-2)" />
  {:else if name === 'effects'}
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /><circle cx="12" cy="12" r="4" />
  {:else if name === 'type'}
    <path d="M4 5h16M12 5v14M8 19h8" />
  {:else if name === 'grid'}
    <rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" />
  {:else if name === 'play'}
    <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />
  {:else if name === 'pause'}
    <path d="M7 5v14M17 5v14" stroke-width="2.5" />
  {:else if name === 'restart'}
    <path d="M5 8a8 8 0 1 1-1 7" /><path d="M5 4v4h4" />
  {:else if name === 'chevron'}
    <path d="m8 10 4 4 4-4" />
  {:else if name === 'plus'}
    <path d="M12 5v14M5 12h14" />
  {:else if name === 'search'}
    <circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" />
  {:else if name === 'download'}
    <path d="M12 3v11M8 10l4 4 4-4M5 20h14" />
  {:else if name === 'code'}
    <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
  {:else if name === 'eye'}
    <path d="M3 12s3.3-5 9-5 9 5 9 5-3.3 5-9 5-9-5-9-5Z" /><circle cx="12" cy="12" r="2" />
  {:else if name === 'lock'}
    <rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
  {:else if name === 'bolt'}
    <path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z" fill="currentColor" stroke="none" />
  {:else if name === 'target'}
    <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  {:else if name === 'brush'}
    <path d="M14.5 4.5 19 9M4 20c4.2.2 7.1-1.3 8.4-4.3L6.8 10 4 20Z" /><path d="m7 10 7-7 4 4-7 7" />
  {:else if name === 'check'}
    <path d="m5 12 4 4L19 6" />
  {:else if name === 'close'}
    <path d="m6 6 12 12M18 6 6 18" />
  {:else if name === 'play-small'}
    <path d="m9 6 8 5-8 5V6Z" fill="currentColor" stroke="none" />
  {:else}
    <circle cx="12" cy="12" r="7" />
  {/if}
</svg>

<style>
  .icon { display: block; flex: 0 0 auto; }
</style>
