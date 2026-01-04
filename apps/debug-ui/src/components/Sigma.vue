<template>
    <div class="sigma" ref="container"></div>
</template>

<script setup lang="ts">
import type Graph from 'graphology';
import Sigma from 'sigma';
import { onMounted, useTemplateRef } from 'vue';

defineOptions({
  name: 'SigmaComponent',
});

const props = defineProps<{
    graph: Graph
}>();

const container = useTemplateRef('container');
let sigma: Sigma | undefined;

onMounted(() => {
    if (container.value) {
        sigma = new Sigma(props.graph, container.value, {
            zoomToSizeRatioFunction: (x) => x,
        });
    }
});

</script>


<style lang="css" scoped>
    .sigma {
        min-width: 600px;
        min-height: 600px;
        margin: 0;
        padding: 0;
    }
</style>
