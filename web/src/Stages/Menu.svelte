<script>
    export let darkMode;

    let text = "Etapa1: Apostas\nAs apostas são estritamente de 5 números;\nOs números podem ser escolhidos manualmente ou de forma aleatória;\nOs participantes podem fazer quantas apostas quiserem.\n\nEtapa 2: Apuração\n"
</script>

<div class="box">
    <h1>Sorteio João Cena™</h1>
    <h2>Como funciona?</h2>

    <hr>

    <div class="text">
        <textarea cols="30" rows="10" class:dark={darkMode} disabled>
{text}
        </textarea>
    </div>
</div>

<style>
    h1 {
        margin: 5px 0;
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

    .box {
        width: 300px;
    }

    .text {
        text-align: left;
    }

</style>