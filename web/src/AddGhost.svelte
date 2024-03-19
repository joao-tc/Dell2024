<script>
    import { createEventDispatcher } from "svelte";
    export let darkMode;

    let dispatch = createEventDispatcher();

    let nGhosts;

    const handleSubmit = (e) => {
        dispatch('addGhost', nGhosts);
    };

</script>


<div>
    <form on:submit|preventDefault={handleSubmit}>
        <h3>Quantidade de participantes:</h3>
        <input type="number" min="0" max="100" pattern="[0-9]" bind:value={nGhosts} class:dark={darkMode} required>
        <button>Confirmar</button>
    </form>
</div>


<style>

    .dark {
        background: #1e1e1e;
        color: white;
    }

</style>