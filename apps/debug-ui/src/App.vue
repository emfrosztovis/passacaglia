<script setup lang="ts">
import { play, VoiceData } from 'species-counterpoint';
import MusicScore from './components/MusicScore.vue';
import { ref } from 'vue';

import Main from './Main.worker?worker';
import type { MainMessage } from './Main.worker';
import { Debug } from 'common';
import { NProgress } from 'naive-ui';

import Sigma from './components/Sigma.vue';
import Graph, { DirectedGraph } from 'graphology';
import { circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import noverlap from 'graphology-layout-noverlap';
import { sugiyama } from './Sugiyama';

let source = ref('');
let blob = ref(undefined as string | undefined);
let graph = ref<Graph | undefined>();

let result: VoiceData[] | undefined;

let progress = ref({
    progress: 0,
    furthest: 0,
    total: 1,
    iteration: 0,
});

const worker = new Main();
worker.onmessage = (ev: MessageEvent<MainMessage>) => {
    switch (ev.data.type) {
        case 'ok':
            result = ev.data.data.map(VoiceData.deserialize);
            source.value = ev.data.source;
            blob.value = URL.createObjectURL(new Blob([source.value]));
            graph.value = DirectedGraph.from(ev.data.graph as any);
            sugiyama(graph.value, 50);
            break;
        case 'no-solution':
            console.log('no solution');
            break;
        case 'progress':
            progress.value = ev.data;
            break;
        case 'log':
            console.log(...ev.data.message);
            break;
        case 'query-score-result':
            source.value = ev.data.source;
            break;
        default:
            Debug.never(ev.data);
    }
}
</script>

<template>
    <div class="container">
        <NProgress v-if="!source" type="multiple-circle" :percentage="[
            progress.furthest / progress.total * 100,
            progress.progress / progress.total * 100,
        ]">
            {{ progress.progress }} / {{ progress.total }}
            <br>
            {{ (progress.iteration / 1000).toFixed(0) }}k
        </NProgress>
        <button v-if="result" @click="play(result, [74, 74, 20, 53], { tempo: 180, synth: true })">
            play
        </button>
        <a v-if="blob" :href="blob" download="result.mxl">
            download
        </a>
        <MusicScore v-if="source" :file="source" />
        <Sigma v-if="graph" :graph="graph" />
    </div>
</template>

<style scoped>
.container {
    min-width: 500px;
}
</style>
