<script>
	import Box from './Component/Box.svelte'
	import AddBet from './Stages/AddBet.svelte';
	import ManualBet from './Stages/ManualBet.svelte';
	import Menu from './Stages/Menu.svelte';
	import StartDraw from './Stages/StartDraw.svelte';
	import Modal from './Component/Modal.svelte';
	import AddGhost from './AddGhost.svelte';
	import Winners from './Stages/Winners.svelte';

	let showModal = false;

	let generalId = 1000;
	let allBets = new Set();
	let nBet = 0;

	let prize = 2535;
	let winners = [];

	let currStage = "menu";

	let darkMode = true;

	const newRandomBet = () => {
		let currBet = new Set();

		while(currBet.size < 5)
			currBet.add(Math.floor(Math.random()*50) + 1)

		return currBet;
	}

	const handleDarkMode = () => {
		darkMode = !darkMode;
	}

	const addBet = (e) => {
		allBets[generalId] = e.detail;

		if(e.detail.betType == "auto") {
			e.detail.bet = newRandomBet();
			currStage = "betDone";
			generalId++;
			nBet++;
		}

		else {
			currStage = "manual";
		}
		
	}

	const manualBet = (e) => {
		let aux = allBets[generalId];

		aux.bet = e.detail;
		generalId++;
		nBet++;
		currStage = "betDone";

	};

	const handleWinners = (e) => {
		winners = e.detail;
		currStage = "winners";
		nBet = 0;
	};

	const addGhost = (n) => {
		showModal = false;

		let phName = "Name";
		let phCpf = "CPF";
		for(let i = 0; i < n.detail; i++) {
			allBets[generalId] = {
				name: phName+(generalId-1000),
				cpf: phCpf+(generalId-1000),
				betType: "auto",
				bet: newRandomBet(),
				id: generalId
			};
			generalId++;
			nBet++;
		}
	}

</script>



<main class="backGround" class:dark={darkMode}>
	{#if showModal}
		<Modal {darkMode}>
			<AddGhost {darkMode} on:addGhost={addGhost}/>
		</Modal>
	{/if}
	<div class="mainDiv">
		{#if currStage === "menu"}
			<Box {darkMode}>
				<Menu {darkMode}/>
			</Box>
		{/if}

		{#if currStage === "bet"}
			<Box {darkMode}>
				<AddBet {darkMode} {generalId} on:addBet={addBet}/>
			</Box>
		{/if}

		{#if currStage === "manual"}
			<Box {darkMode}>
				<ManualBet {darkMode} {generalId} on:manualBet={manualBet}/>
			</Box>
		{/if}

		{#if currStage === "betDone"}
			<Box {darkMode}>
				<h1>Aposta concluida!</h1>
				<button class:dark={darkMode} on:click={()=>{currStage="bet"}}>Nova aposta</button>
			</Box>
		{/if}

		{#if currStage === "draw"}
			<Box {darkMode}>
				<StartDraw {darkMode} {prize} {allBets} {nBet} draw={newRandomBet()} on:winnersList={handleWinners}/>
			</Box>
		{/if}

		{#if currStage === "winners"}
			<Box {darkMode}>
				<Winners {darkMode} {winners} {allBets}/>
			</Box>
		{/if}
		
	</div>
	
	<div class="buttons">
		<button on:click={handleDarkMode} class:dark={darkMode}>Dark Mode: {darkMode}</button>
		{#if currStage === "menu"}
			<button on:click={()=>{currStage="bet"}} class:dark={darkMode}>Iniciar apostas</button>
		{/if}
		{#if currStage === "bet"}
			<button on:click={()=>{currStage="menu"}} class:dark={darkMode}>Voltar ao menu</button>
			<button on:click|once={()=>showModal=true} class:dark={darkMode}>Adicionar participantes fantasma</button>
		{/if}
		{#if nBet > 0 && currStage !== "draw"}
			<button on:click|once={()=>{currStage="draw"}} class:dark={darkMode}>Iniciar Sorteio</button>
		{/if}
	</div>

</main>

<style>

	.mainDiv {
		margin: -1em auto;
		margin-top: -5%;
		width: 100%;
		height: 75%;

		display: block;
	}

	.backGround {
		width: 100%;
		height: 100%;
		position: fixed;
		background: lightgrey;
		color: gray;
	}

	button {
		border-radius: 10px;
		margin: 5px 10px;
	}

	.dark {
		background: #1e1e1e;
		color: white;
	}

	.buttons {
		margin: auto;
		text-align: center;
	}

</style>