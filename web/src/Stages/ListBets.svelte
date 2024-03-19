<script>
    export let darkMode;
    export let allBets;
    export let nBet;

    let allText;

    const getAllBets = () => {
        let aux = ""

        for(let i = 0; i < nBet; i++) {
            let currBet = allBets[1000+i];
            aux+= "ID da aposta " + currBet.id;
            aux+= "\nNome do participante: " + currBet.name;
            aux+= "\nNúmeros apostados: " + setToString(currBet.bet) + "\n\n";
        }

        return aux;
    };

    const setToString = (e) => {
        let aux = "";

        e.forEach(i => {
            aux += i + " ";
        });

        return aux;
    };

    allText = getAllBets();

</script>

<div class:dark={darkMode}>
    <textarea cols="34" rows="15" class:dark={darkMode} disabled>
{allText}
    </textarea>
</div>

<style>

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