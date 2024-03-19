<script>
    export let darkMode;
</script>

<div class="box" class:dark={darkMode}>
    <slot></slot>
</div>

<style>

    .box {
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

</style>