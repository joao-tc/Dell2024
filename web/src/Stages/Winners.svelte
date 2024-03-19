<script>
    export let darkMode;
    export let allBets = new Set();
    export let winners = [];
    export let prize;

    const getWinnersText = () => {
        let aux = "";

        for(let i = 0; i < winners.length; i++) {
            let currBet = allBets[winners[i]];
            aux+= "ID da aposta: " + currBet.id;
            aux+= "\nNome do participante: " + currBet.name;
            aux+= "\nNúmeros apostados: " + currBet.bet + "\n";
        }

        return aux;
    };

</script>

<div class:dark={darkMode}>
    {#if winners.length > 0}
    {#if winners.length === 1}
        <h1>Vencedor:</h1>
    {:else}  
        <h1>Vencedores:</h1>
    {/if}
        <hr>
        <textarea cols="30" rows="10">
{getWinnersText()}            
        </textarea>
        <!-- <h4></h4> -->
        <hr>
        <h2>Valor final do prêmio:</h2>
        <h3>{prize}</h3>
    {:else}
        <h1>Não houveram vencedores</h1>
    {/if}
    
</div>

<style>

    .dark {
        background: black;
        color: white;
    }

</style>