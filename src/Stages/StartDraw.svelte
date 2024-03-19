<script>
    import { createEventDispatcher } from "svelte";
    export let darkMode;
    export let prize;
    export let nBet;
    export let draw = new Set();
    export let allBets = new Set();

    let dispatch = createEventDispatcher();

    let turn = 0;
    let winners = [];
    let drawnNums;
    
    const drawNewNum = () => {
        let len1 = draw.size
        
        while(draw.size == len1) {
            draw.add(Math.floor(Math.random() * 50) + 1)
        }
    };

    const handleHasWinner = () => {
        dispatch('winnersList', winners)
    };

    const checkForWinner = () => {
        let hasWinner = true;

        for(let i = 0; i < nBet; i++) {

            hasWinner = true;

            let currBet = new Set();
            currBet = allBets[1000+i].bet;
            const setIter = currBet.values();

            for(let j = 0; j < 5; j++) {
                let currNum = setIter.next().value;
                try {
                    if(draw.has(currNum) == false){
                        hasWinner = false;
                        break;
                    }
                } catch (error) {
                    hasWinner = false;
                    break;
                }

            }

            if(hasWinner == true) {
                winners.push(1000+i);
                break;
            }

            //console.log("Verificando participante", i);
        }

        if(hasWinner == true || turn >= 25) {
            handleHasWinner();
        }

        if(hasWinner == false) {
            drawNewNum();
            drawnNums = getDrawnNums();
            turn+=1;
            prize *= 1.2;
        }
    };

    const getDrawnNums = () => {
        drawnNums = ""

        draw.forEach(i => {
            drawnNums += i + " "
        });

        return drawnNums;
    };

    drawnNums = getDrawnNums();

</script>

<div>
    <h2>Números Sorteados:</h2>
    <h3>{drawnNums}</h3>

    <hr>

    <h2>Turno do Sorteio</h2>
    <h3>{turn}</h3>

    <hr>

    <h2>Valor do Prêmio</h2>
    <h3>{prize.toFixed(2)} reais</h3>

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