<script>
    import { createEventDispatcher } from "svelte";
    export let darkMode;
    
    let currBet = new Set();

    let dispatch = createEventDispatcher();

    let n1, n2, n3, n4, n5;

    const handleSubmit = () => {
        currBet = new Set([n1, n2, n3, n4, n5]);

        if(currBet.size < 5) {
            alert("Deve-se escolher 5 números diferentes")
        } else {
            dispatch('manualBet', currBet);
        }
    };

    const handleClick = i => {
        console.log(i);
    }

    const startButtons = () => {
        for(let i = 1; i <= 50; i++) {
            var newButton = document.createElement("button");

            newButton.value=i;
            newButton.textContent=i;
            newButton.click(handleClick(i))
            newButton.className="numButton";

            document.getElementById("here").appendChild(newButton);
        }
        
    }
</script>

<form on:submit|preventDefault={handleSubmit}>
    <h2>Escolha seus números:</h2>
    <!-- <button on:click|once={startButtons} class:dark={darkMode} >teste</button> -->
    <!-- <p>{currBet}</p> -->

    <div class="grid">
        <input type="number" class="num" class:dark={darkMode} min="1" max="50" pattern="[0-9]" bind:value={n1} required>
        <input type="number" class="num" class:dark={darkMode} min="1" max="50" pattern="[0-9]" bind:value={n2} required>
        <input type="number" class="num" class:dark={darkMode} min="1" max="50" pattern="[0-9]" bind:value={n3} required>
        <input type="number" class="num" class:dark={darkMode} min="1" max="50" pattern="[0-9]" bind:value={n4} required>
        <input type="number" class="num" class:dark={darkMode} min="1" max="50" pattern="[0-9]" bind:value={n5} required>
    </div>

    <button class:dark={darkMode}>Confirmar números</button>
</form>


<style>

    .grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
    }

    .dark {
        background: #1e1e1e;
        color: white;
    }

    .num {
        width: 3em;
    }

    /* .numButton {
        width: 5px;
        height: 5px;

        border-radius: 10px;
    } */

</style>