<script>
    import { createEventDispatcher } from "svelte";
    export let darkMode, generalId;

    let dispatch = createEventDispatcher();

    let name;
    let cpf;
    let betType;

    const handleSubmit = () => {
        const bet = {
            name,
            cpf,
            betType,
            bet: "placeHolder",
            id: generalId
        };

        dispatch('addBet', bet)
    }
</script>

<form on:submit|preventDefault={handleSubmit}>
    <h2>Nova aposta</h2>
    <input type="text" placeholder="Nome" class:dark={darkMode} bind:value={name} required><br>
    <input type="number" pattern="[0-9]" minlength="11" placeholder="CPF" class:dark={darkMode} bind:value={cpf} required><br>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>Tipo de aposta:</label>
    <select bind:value={betType} class:dark={darkMode}>
        <option value="auto">Aposta automática</option>
        <option value="manual">Aposta manual</option>
    </select>
    <hr>
    <button class:dark={darkMode}>Confirmar dados</button>
</form>

<style>

    .dark {
        background: #1e1e1e;
        color: white;
        border-color: gray;
    }

    hr {
        margin: 10px auto;
    }

    h2 {
        margin-top: 0;
    }

    select {
        margin-top: 5px;
    }

</style>