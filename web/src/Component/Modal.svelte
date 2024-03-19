<script>
    export let darkMode;
    let showModal = true;
</script>

{#if showModal}
    <div class="backdrop" class:darkBD={darkMode}>
        <div class="modal" class:dark={darkMode}>
            <slot></slot>
        </div>
    </div>
{/if}

<style>

    .backdrop {
        width: 100%;
        height: 100%;
        position: fixed;
        background: rgba(0, 0, 0, 0.8);
    }

    .modal {
        padding: 20px;
        border-radius: 15px;
        max-width: 300px;
        margin: 10% auto;
        text-align: center;
        background: white;
        color: black;
    }

    .dark {
        background: black;
        color: white;
    }

    .darkBD {
        background: rgba(50, 50, 50, 0.8);
    }

</style>