<script setup lang="ts">
import { play, type Score } from 'species-counterpoint';
import MusicScore from './components/MusicScore.vue';
import { ref } from 'vue';

import Main from './Main.worker?worker';
import type { MainMessage } from './Main.worker';
import { Debug } from 'common';

let source = ref('');
let result: Score | undefined;

const worker = new Main();
worker.onmessage = (ev: MessageEvent<MainMessage>) => {
    switch (ev.data.type) {
        case 'ok':
            // result = ev.data.result;
            source.value = ev.data.source;
            break;
        case 'no-solution':
            console.log('no solution');
            break;
        case 'log':
            console.log(...ev.data.message);
            break;
        default:
            Debug.never(ev.data);
    }
}

</script>

<template v-if="source">
    <button v-if="result" @click="play(result, [72, 72, 72, 72], { tempo: 180, synth: true })">
        play
    </button>
    <MusicScore :file="source" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
