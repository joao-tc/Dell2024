<script>
    export let darkMode;
    export let prize;
    export let nBet;
    export let draw = new Set();
    export let allBets = new Set();

    let turn = 0;
    let drawnNums;
    let winners = [];

    const checkForWinner = () => {
        let hasWinner = true;

        for(let i = 0; i < nBet; i++) {

            hasWinner = true;

            let currBet = allBets[1000+i];
            currBet = currBet.bet;

            for(let j = 0; j < 5; j++) {
                if(!draw.has(currBet[j])) {
                    hasWinner = false;
                }
            }

            if(hasWinner == true) {
                winners.push(1000+i);
            }
        }

        console.log(allBets, hasWinner);

        return hasWinner;
    };

    const getDrawnNums = () => {
        drawnNums = ""

        draw.forEach(i => {
            drawnNums += i + " "
        });

        return drawnNums;
    };

</script>

<div>
    <h2>Números Sorteados:</h2>
    <h3>{getDrawnNums()}</h3>

    <hr>

    <h2>Turno do Sorteio</h2>
    <h3>{turn}</h3>

    <hr>

    <h2>Valor do Premio</h2>
    <h3>{prize} reais</h3>

    <hr>

    <button class:dark={darkMode} on:click={()=>checkForWinner()}>Próximo Turno</button>

</div>

<style>

    .dark {
        background: #1e1e1e;
        color: white;
    }

    button {
        margin-top: 10px;
    }

    h2 {
        margin-bottom: 0;
    }

    h3 {
        margin-top: 0;
    }
</style>