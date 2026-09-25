<script setup lang="ts">
import { onKeyStroke, useElementSize, useLocalStorage, useRafFn } from '@vueuse/core';
import { ChevronLeft, ChevronRight, Contrast, Grid3x3, Maximize, MessageSquarePlus, Minus, MoveDiagonal, Pause, Play, Plus } from '@lucide/vue';
import type { Feedback } from '~/utils/types';

const props = defineProps<{
  src: string;
  /** A raster (or SVG) of the current revision for the comparison and 9-slice views. */
  imageSrc?: string;
  format?: 'svg' | 'html';
  width: number;
  height: number;
  duration?: number;
  frames?: number;
  nineSlice?: number[] | null;
  pins?: Feedback[];
  compareSrc?: string | null;
  compareLabel?: string;
}>();
const emit = defineEmits<{ pin: [x: number, y: number]; closeCompare: [] }>();
const annotate = defineModel<boolean>('annotate', { default: false });

const stage = ref<HTMLElement>();
const viewer = ref<HTMLObjectElement>();
const frame = ref<HTMLIFrameElement>();
const html = computed(() => props.format === 'html');
const still = computed(() => props.imageSrc ?? props.src);
const { width: stageWidth, height: stageHeight } = useElementSize(stage);
const backdrop = useLocalStorage<'checker' | 'dark' | 'light' | 'custom'>('gesso-backdrop', 'checker');
const customColor = useLocalStorage('gesso-backdrop-color', '#3a5a40');
const grayscale = ref(false);
const guides = ref(true);
const stretch = ref(false);
const stretchSize = ref([1.6, 1]);
const zoom = ref(0); // 0 = fit
const pan = reactive({ x: 0, y: 0 });
const swipe = ref([50]);

const stretchX = computed(() => (stretch.value ? stretchSize.value[0]! : 1));
const stretchY = computed(() => (stretch.value ? stretchSize.value[1]! : 1));
const fit = computed(() => Math.max(0.05, Math.min(8, (stageWidth.value - 64) / (props.width * stretchX.value), (stageHeight.value - 64) / (props.height * stretchY.value))));
const scale = computed(() => zoom.value || fit.value);
const boxWidth = computed(() => props.width * scale.value * stretchX.value);
const boxHeight = computed(() => props.height * scale.value * stretchY.value);
const slice = computed(() => props.nineSlice ?? [0, 0, 0, 0]);

watch(() => props.src, () => {
  playing.value = true;
  time.value = 0;
});
watch(() => [props.width, props.height, stretch.value], () => {
  zoom.value = 0;
  pan.x = pan.y = 0;
});

function setZoom(next: number) {
  zoom.value = Math.min(16, Math.max(0.05, next));
}
function fitView() {
  zoom.value = 0;
  pan.x = pan.y = 0;
}
function onWheel(event: WheelEvent) {
  event.preventDefault();
  const before = scale.value;
  const after = Math.min(16, Math.max(0.05, before * (event.deltaY < 0 ? 1.12 : 1 / 1.12)));
  const rect = stage.value!.getBoundingClientRect();
  const cx = event.clientX - rect.left - rect.width / 2 - pan.x;
  const cy = event.clientY - rect.top - rect.height / 2 - pan.y;
  pan.x -= cx * (after / before - 1);
  pan.y -= cy * (after / before - 1);
  zoom.value = after;
}

let drag: { x: number; y: number } | null = null;
function onPointerDown(event: PointerEvent) {
  if (annotate.value || event.button !== 0) return;
  drag = { x: event.clientX - pan.x, y: event.clientY - pan.y };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function onPointerMove(event: PointerEvent) {
  if (!drag) return;
  pan.x = event.clientX - drag.x;
  pan.y = event.clientY - drag.y;
}
function onArtClick(event: MouseEvent) {
  if (!annotate.value) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  emit('pin', Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)));
  annotate.value = false;
}

// Animation control reaches into the embedded SVG document (same origin).
const playing = ref(true);
const time = ref(0);
const fps = computed(() => (props.frames && props.duration ? props.frames / props.duration : 24));
function content() {
  const document = viewer.value?.contentDocument;
  return { svg: document?.documentElement as unknown as SVGSVGElement | undefined, css: document?.getAnimations?.() ?? [] };
}
function prepare() {
  const { svg } = content();
  svg?.setAttribute('width', '100%');
  svg?.setAttribute('height', '100%');
  if (!playing.value) seek(time.value);
}
let clock = 0; // HTML previews run in a sandboxed frame; track their time locally
const onFrameLoad = () => (clock = performance.now());
function seek(seconds: number) {
  const duration = props.duration || 1;
  time.value = ((seconds % duration) + duration) % duration;
  playing.value = false;
  if (html.value) {
    frame.value?.contentWindow?.postMessage({ gesso: 'seek', t: time.value }, '*');
    return;
  }
  const { svg, css } = content();
  svg?.pauseAnimations?.();
  svg?.setCurrentTime?.(time.value);
  for (const animation of css) {
    animation.pause();
    animation.currentTime = time.value * 1000;
  }
}
function togglePlay() {
  if (html.value) {
    if (playing.value) seek(time.value);
    else {
      playing.value = true;
      clock = performance.now() - time.value * 1000;
      frame.value?.contentWindow?.postMessage({ gesso: 'play', t: time.value }, '*');
    }
    return;
  }
  const { svg, css } = content();
  if (playing.value) {
    seek((svg?.getCurrentTime?.() ?? time.value) % (props.duration || 1));
  } else {
    playing.value = true;
    svg?.unpauseAnimations?.();
    for (const animation of css) animation.play();
  }
}
const step = (frames: number) => seek(time.value + frames / fps.value);
// keep the readout moving while the animation plays
useRafFn(() => {
  if (!playing.value || !props.duration) return;
  if (html.value) {
    time.value = (((performance.now() - clock) / 1000) % props.duration);
    return;
  }
  const { svg, css } = content();
  const seconds = svg?.getCurrentTime?.() || (Number(css[0]?.currentTime ?? 0) / 1000);
  time.value = seconds % props.duration;
});

const typing = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName ?? '').toUpperCase());
onKeyStroke(['g', 'G'], () => !typing() && (grayscale.value = !grayscale.value));
onKeyStroke(['f', 'F'], () => !typing() && fitView());
onKeyStroke('1', () => !typing() && setZoom(1));
onKeyStroke(' ', (event) => {
  if (typing() || !props.duration) return;
  event.preventDefault();
  togglePlay();
});
onKeyStroke(',', () => !typing() && props.duration && step(-1));
onKeyStroke('.', () => !typing() && props.duration && step(1));

const backdropClass = computed(() => ({ checker: 'checker', dark: 'bg-[#08090a]', light: 'bg-[#ece9e2]', custom: '' })[backdrop.value]);
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex flex-wrap items-center gap-2 border-b px-3 py-2">
      <ToggleGroup v-model="backdrop" type="single" variant="outline" size="sm" aria-label="Backdrop">
        <ToggleGroupItem value="checker" class="px-2.5 text-xs">Alpha</ToggleGroupItem>
        <ToggleGroupItem value="dark" class="px-2.5 text-xs">Dark</ToggleGroupItem>
        <ToggleGroupItem value="light" class="px-2.5 text-xs">Light</ToggleGroupItem>
        <ToggleGroupItem value="custom" class="px-2 text-xs"><span class="size-3.5 rounded-sm border" :style="{ background: customColor }" /></ToggleGroupItem>
      </ToggleGroup>
      <input v-if="backdrop === 'custom'" v-model="customColor" type="color" class="h-8 w-8 cursor-pointer rounded border bg-transparent" aria-label="Backdrop color" />
      <Separator orientation="vertical" class="!h-5" />
      <div class="flex items-center">
        <Button variant="ghost" size="icon" class="size-8" aria-label="Zoom out" @click="setZoom(scale / 1.25)"><Minus class="size-4" /></Button>
        <button class="w-14 text-center text-xs tabular-nums text-muted-foreground hover:text-foreground" title="Actual size (1)" @click="setZoom(1)">{{ Math.round(scale * 100) }}%</button>
        <Button variant="ghost" size="icon" class="size-8" aria-label="Zoom in" @click="setZoom(scale * 1.25)"><Plus class="size-4" /></Button>
        <Button variant="ghost" size="sm" class="h-8 text-xs" title="Fit (F)" @click="fitView"><Maximize class="size-3.5" /> Fit</Button>
      </div>
      <Separator orientation="vertical" class="!h-5" />
      <Toggle v-model="grayscale" size="sm" variant="outline" class="h-8 text-xs" title="Value check (G)"><Contrast class="size-3.5" /> Values</Toggle>
      <template v-if="nineSlice">
        <Toggle v-model="guides" size="sm" variant="outline" class="h-8 text-xs" title="9-slice guides"><Grid3x3 class="size-3.5" /> 9-slice</Toggle>
        <Toggle v-model="stretch" size="sm" variant="outline" class="h-8 text-xs" title="Stretch the asset the way the engine will"><MoveDiagonal class="size-3.5" /> Stretch test</Toggle>
      </template>
      <div class="ml-auto flex items-center gap-2">
        <Toggle v-model="annotate" size="sm" variant="outline" class="h-8 text-xs" :class="annotate && 'border-warning text-warning'"><MessageSquarePlus class="size-3.5" /> {{ annotate ? 'Click the art…' : 'Pin feedback' }}</Toggle>
      </div>
    </div>

    <div v-if="stretch && nineSlice" class="flex items-center gap-4 border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <span>Width ×{{ stretchSize[0]!.toFixed(1) }}</span>
      <Slider :model-value="[stretchSize[0]!]" :min="0.6" :max="4" :step="0.1" class="w-40" @update:model-value="(value) => value && (stretchSize = [value[0]!, stretchSize[1]!])" />
      <span>Height ×{{ stretchSize[1]!.toFixed(1) }}</span>
      <Slider :model-value="[stretchSize[1]!]" :min="0.6" :max="4" :step="0.1" class="w-40" @update:model-value="(value) => value && (stretchSize = [stretchSize[0]!, value[0]!])" />
      <span class="ml-auto">Corners must stay crisp; only edges and centre may stretch.</span>
    </div>

    <div
      ref="stage"
      class="relative min-h-0 flex-1 overflow-hidden select-none"
      :class="[backdropClass, annotate ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing']"
      :style="backdrop === 'custom' ? { background: customColor } : undefined"
      @wheel="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="drag = null"
      @dblclick="fitView"
    >
      <div class="absolute top-1/2 left-1/2" :style="{ transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))` }">
        <div class="relative" :style="{ width: `${boxWidth}px`, height: `${boxHeight}px` }" @click="onArtClick">
          <!-- stretch test: the browser's own 9-slice (border-image) behaves like engine 9-slicing -->
          <div
            v-if="stretch && nineSlice"
            class="absolute inset-0"
            :class="grayscale && 'grayscale'"
            :style="{
              borderStyle: 'solid',
              borderWidth: slice.map((value) => `${value * scale}px`).join(' '),
              borderImageSource: `url('${still}')`,
              borderImageSlice: `${slice.join(' ')} fill`,
              borderImageRepeat: 'stretch'
            }"
          />
          <template v-else-if="compareSrc">
            <img :src="compareSrc" alt="" class="absolute inset-0 size-full" :class="grayscale && 'grayscale'" draggable="false" />
            <img :src="still" alt="" class="absolute inset-0 size-full" :class="grayscale && 'grayscale'" :style="{ clipPath: `inset(0 0 0 ${swipe[0]}%)` }" draggable="false" />
            <div class="pointer-events-none absolute inset-y-0 w-px bg-brand shadow-[0_0_0_1px_rgba(0,0,0,.3)]" :style="{ left: `${swipe[0]}%` }" />
          </template>
          <iframe v-else-if="html" :key="`f-${src}`" ref="frame" :src="src" sandbox="allow-scripts" scrolling="no" class="pointer-events-none absolute inset-0 size-full border-0 [color-scheme:normal]" :class="grayscale && 'grayscale'" :style="{ width: `${width}px`, height: `${height}px`, transform: `scale(${scale})`, transformOrigin: '0 0' }" @load="onFrameLoad" />
          <object v-else :key="src" ref="viewer" :data="src" type="image/svg+xml" class="pointer-events-none absolute inset-0 size-full [color-scheme:normal]" :class="grayscale && 'grayscale'" @load="prepare" />

          <template v-if="guides && nineSlice && !compareSrc">
            <i class="pointer-events-none absolute inset-x-0 border-t border-dashed border-sky-400/80" :style="{ top: `${slice[0]! * scale}px` }" />
            <i class="pointer-events-none absolute inset-x-0 border-t border-dashed border-sky-400/80" :style="{ bottom: `${slice[2]! * scale}px` }" />
            <i class="pointer-events-none absolute inset-y-0 border-l border-dashed border-sky-400/80" :style="{ left: `${slice[3]! * scale}px` }" />
            <i class="pointer-events-none absolute inset-y-0 border-l border-dashed border-sky-400/80" :style="{ right: `${slice[1]! * scale}px` }" />
          </template>

          <template v-if="!stretch">
            <span
              v-for="(pin, index) in pins?.filter((item) => item.x !== null && item.y !== null)"
              :key="pin.id"
              class="absolute grid size-6 -translate-x-1/2 -translate-y-full place-items-center rounded-full rounded-bl-none border-2 border-background text-[11px] font-semibold shadow-lg"
              :class="pin.status === 'open' ? 'bg-warning text-black' : 'bg-muted text-muted-foreground'"
              :style="{ left: `${pin.x! * 100}%`, top: `${pin.y! * 100}%` }"
              :title="pin.body"
            >{{ index + 1 }}</span>
          </template>
        </div>
      </div>

      <div v-if="compareSrc" class="absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-3 rounded-full border bg-background/90 px-4 py-1.5 text-xs shadow-lg backdrop-blur" @pointerdown.stop>
        <span class="text-muted-foreground">{{ compareLabel }}</span>
        <Slider v-model="swipe" :min="0" :max="100" :step="1" class="w-48" />
        <span>Current</span>
        <Button variant="ghost" size="sm" class="h-6 px-2 text-xs" @click="emit('closeCompare')">Done</Button>
      </div>
    </div>

    <div v-if="duration && !compareSrc && !stretch" class="flex items-center gap-3 border-t bg-card px-3 py-2">
      <Button variant="ghost" size="icon" class="size-8" aria-label="Previous frame (,)" @click="step(-1)"><ChevronLeft class="size-4" /></Button>
      <Button variant="secondary" size="icon" class="size-8" :aria-label="playing ? 'Pause (space)' : 'Play (space)'" @click="togglePlay"><Pause v-if="playing" class="size-4" /><Play v-else class="size-4" /></Button>
      <Button variant="ghost" size="icon" class="size-8" aria-label="Next frame (.)" @click="step(1)"><ChevronRight class="size-4" /></Button>
      <Slider :model-value="[time]" :min="0" :max="duration" :step="0.001" class="flex-1" aria-label="Scrub" @update:model-value="(value) => value && seek(value[0]!)" />
      <span class="w-32 text-right font-mono text-xs text-muted-foreground tabular-nums">{{ time.toFixed(2) }} / {{ duration.toFixed(2) }}s · f{{ Math.floor(time * fps) + 1 }}</span>
    </div>
  </div>
</template>
