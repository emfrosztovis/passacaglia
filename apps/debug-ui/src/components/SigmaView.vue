<template>
    <div class="sigma" ref="container"></div>
</template>

<script setup lang="ts">
import EdgeCurveProgram from '@sigma/edge-curve';
import type Graph from 'graphology';
import Sigma from 'sigma';
import { onMounted, useTemplateRef } from 'vue';
import { NodeSquareProgram } from "@sigma/node-square";
import { DEFAULT_NODE_PROGRAM_CLASSES } from 'sigma/settings';

defineOptions({
  name: 'SigmaComponent',
});

const props = defineProps<{
    graph: Graph,
    filter?: (n: string) => boolean,
    onClickNode?: (n: string, s: Sigma) => void,
    onHoverNode?: (n: string, s: Sigma) => void
}>();

const container = useTemplateRef('container');
let sigma: Sigma | undefined;

onMounted(() => {
    if (container.value) {
        sigma = new Sigma(props.graph, container.value, {
            zoomToSizeRatioFunction: (x) => x,
            itemSizesReference: 'positions',
            edgeProgramClasses: {
                curved: EdgeCurveProgram,
            },
            nodeProgramClasses: {
                ...DEFAULT_NODE_PROGRAM_CLASSES,
                // square: NodeSquareProgram
            },
            nodeReducer: (n, attr) => {
                if (props.filter && !props.filter(n)) {
                    return {
                        ...attr,
                        color: '#DDD'
                    };
                };
                return attr;
            }
        });
        sigma.on('clickNode', (x) => {
            props.onClickNode?.(x.node, sigma!);
        });
        sigma.on('enterNode', (x) => {
            props.onHoverNode?.(x.node, sigma!);
        })
    }
});

</script>


<style lang="css" scoped>
    .sigma {
        min-width: 600px;
        min-height: 600px;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
    }
</style>
