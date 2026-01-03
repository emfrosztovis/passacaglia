<script setup lang="ts">
import { play, VoiceData } from 'species-counterpoint';
import MusicScore from './components/MusicScore.vue';
import { ref } from 'vue';

import Main from './Main.worker?worker';
import type { MainMessage } from './Main.worker';
import { Debug } from 'common';
import { NProgress } from 'naive-ui';

let source = ref('');
let blob = ref(undefined as string | undefined);
let result: VoiceData[] | undefined;
let progress = ref([0, 0] as [number, number]);

const worker = new Main();
worker.onmessage = (ev: MessageEvent<MainMessage>) => {
    switch (ev.data.type) {
        case 'ok':
            result = ev.data.data.map(VoiceData.deserialize);
            source.value = ev.data.source;
            blob.value = URL.createObjectURL(new Blob([source.value]));
            console.log(source.value);
            break;
        case 'no-solution':
            console.log('no solution');
            break;
        case 'progress':
            progress.value = [ev.data.progress, ev.data.total];
            break;
        case 'log':
            console.log(...ev.data.message);
            break;
        default:
            Debug.never(ev.data);
    }
}

</script>

<template>
    <div class="container">
        <NProgress v-if="!source" type="line" :percentage="progress[0] / progress[1] * 100">
            {{ progress[0] }} / {{ progress[1] }}
        </NProgress>
        <button v-if="result" @click="play(result, [74, 74, 20, 53], { tempo: 180, synth: true })">
            play
        </button>
        <a v-if="blob" :href="blob" download="result.mxl">
            download
        </a>
        <MusicScore v-if="source" :file="source" />
    </div>
</template>

<style scoped>
.container {
    min-width: 500px;
}
</style>
