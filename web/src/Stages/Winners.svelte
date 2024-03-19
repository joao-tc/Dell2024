<script>
    export let darkMode;
    export let allBets = new Set();
    export let winners = [];

    const getWinnersText = () => {
        let aux = "";

        for(let i = 0; i < winners.length; i++) {
            let currBet = allBets[winners[i]];
            aux+= "ID da aposta: " + currBet.id
            aux+= "Nome do participante: " + currBet.name
            aux+= "Números apostados: " + currBet.bet
        }

        return aux;
    };

</script>

<div class:dark={darkMode}>
    <h1>Vencedores:</h1>
    <hr>
    <h3>{getWinnersText()}</h3>
</div>

<style>

    .dark {
        background: black;
        color: white;
    }

</style>