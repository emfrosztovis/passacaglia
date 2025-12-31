<script setup lang="ts">
import { CounterpointContext, CounterpointScoreBuilder, FirstSpecies, parseNotes, play, Rules, SecondSpecies, ThirdSpecies } from 'species-counterpoint';
import MusicScore from './components/MusicScore.vue';
import { Debug, LogLevel, Rational } from 'common';
import { StandardHeptatonic } from 'core';
import { ref } from 'vue';
import { Clef, toMxl } from 'musicxml';

const ctx = new CounterpointContext(
    14, // targetMeasures
    {
        measureLength: new Rational(4)
    }
);

ctx.localRules = [
    Rules.limitConsecutiveLeaps,
    Rules.forbidPerfectsBySimilarMotion,
    // Rules.forbidNearbyPerfects,
    Rules.forbidVoiceOverlapping,
    Rules.prioritizeVoiceMotion,
];

ctx.candidateRules = [
    Rules.enforceScaleTones(
        StandardHeptatonic.Scales.C.major),
    Rules.enforcePassingTones,
    Rules.enforceMelodyIntervals,
    Rules.enforceDirectionalDegreeMatrix(
        StandardHeptatonic.Scales.C.major,
        Rules.DegreeMatrixPreset.major),
    Rules.enforceLeapPreparationBefore,
    Rules.enforceLeapPreparationAfter,
];

ctx.advanceReward = 100;

ctx.allowUnison = false;

const score = new CounterpointScoreBuilder(ctx)
    .soprano(ThirdSpecies)
    // .alto(SecondSpecies)
    // .tenor(SecondSpecies)
    .tenor(SecondSpecies)
    .cantus(Clef.Bass, [
        parseNotes(['c3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['e3', ctx.parameters.measureLength]),
        parseNotes(['g3', ctx.parameters.measureLength]),
        parseNotes(['f3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['b2', ctx.parameters.measureLength]),
        parseNotes(['c3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['e3', ctx.parameters.measureLength]),
        parseNotes(['g3', ctx.parameters.measureLength]),
        parseNotes(['f3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['b2', ctx.parameters.measureLength]),
    ])
    .build();

Debug.level = LogLevel.Trace;
const result = ctx.solve(score);
console.log(result?.toString());

const source = ref('');

if (result) {
    source.value = toMxl.score(result.voices);
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
