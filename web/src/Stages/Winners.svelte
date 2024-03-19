<script>
    export let darkMode;
    export let allBets = new Set();
    export let winners = [];
    export let prize;
    export let turn;

    const getWinnersText = () => {
        let aux = "";

        for(let i = 0; i < winners.length; i++) {
            let currBet = allBets[winners[i]];
            aux+= "ID da aposta: " + currBet.id;
            aux+= "\nNome do participante: " + currBet.name;
            aux+= "\nNúmeros apostados: " + setToString(currBet.bet) + "\n";
        }

        return aux;
    };

    const setToString = (e) => {
        let aux = ""

        console.log(e);

        e.forEach(i => {
            aux += i + " "
        });

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
        <textarea cols="34" rows="10" class:dark={darkMode} disabled>
{getWinnersText()}            
        </textarea>
        <hr>
        <h3>Após {turn} turnos:</h3>
        <h2>Valor final do prêmio:</h2>
        <h3>{prize.toFixed(2)} reais</h3>
    {:else}
        <h1>Não houveram vencedores</h1>
    {/if}
    
</div>

<style>

    h2 {
        margin-top: -1em;
    }

    textarea {
        resize: none;
        background: white;
        border-color: white;
    }

    textarea::-webkit-scrollbar {
        background: rgba(0, 0, 0, 0);
        width: 3px;
    }

    textarea::-webkit-scrollbar-thumb {
        background: rgba(100, 100, 100, 0.5);
        border-radius: 5px;
    }

    .dark {
        background: black;
        color: white;
        border-color: black;
    }

</style>