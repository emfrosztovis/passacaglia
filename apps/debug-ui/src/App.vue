<script setup lang="ts">
import { play, VoiceData } from 'species-counterpoint';
import MusicScore from './components/MusicScore.vue';
import { ref } from 'vue';

import Main from './Main.worker?worker';
import type { MainMessage, MainMessageIn } from './Main.worker';
import { Debug } from 'common';
import { NProgress } from 'naive-ui';

import Graph, { DirectedGraph } from 'graphology';
import type { Sigma } from 'sigma';
import SigmaView from './components/SigmaView.vue';

let source = ref('');
let blob = ref(undefined as string | undefined);
let graph = ref<Graph | undefined>();

let result: VoiceData[] | undefined;
let focusedNode: number | undefined;

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
            // reingoldTilford(graph.value);
            // forceAtlas2.assign(graph.value, {
            //     iterations: 50,
            //     settings: {
            //         edgeWeightInfluence: 0,
            //         gravity: 0.5
            //     }
            // });
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

function focusNode(n: string, s: Sigma) {
    worker.postMessage({
        type: 'query-score',
        node: n
    } satisfies MainMessageIn);
    focusedNode = Number.parseInt(n);
    s.refresh({ skipIndexation: true });
}

function filterNode(n: string) {
    if (focusedNode === undefined) return true;
    return Number.parseInt(n) <= focusedNode;
}

</script>

<template>
    <NProgress v-if="!source" type="multiple-circle" :percentage="[
        progress.furthest / progress.total * 100,
        progress.progress / progress.total * 100,
    ]">
        {{ progress.progress }} / {{ progress.total }}
        <br>
        {{ (progress.iteration / 1000).toFixed(0) }}k
    </NProgress>

    <div class="container">
        <button v-if="result" @click="play(result, [74, 74, 20, 53], { tempo: 180, synth: true })">
            play
        </button>
        <!-- <a v-if="blob" :href="blob" download="result.mxl">download</a> -->
        <div class="content">
            <div>
                <MusicScore v-if="source" :file="source" />
            </div>

            <div>
                <SigmaView v-if="graph" :graph="graph" :filter="filterNode"
                    v-on:hover-node="focusNode" />
            </div>
        </div>
    </div>
</template>

<style scoped>
    .container {
        display: flex;
        width: 100%;
        height: 100%;
    }

    button {
        position: absolute;
        left: 0;
        top: 0;
    }
    .content {
        flex-grow: 1;
        min-width: 500px;
        height: 100%;

        & > div {
            position: absolute;
            left: 0;
            top: 2em;
            width: 100%;
            height: 100%;
        }
    }
</style>
