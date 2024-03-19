<script>
	import Box from './Component/Box.svelte'
	import AddBet from './Stages/AddBet.svelte';
	import ManualBet from './Stages/ManualBet.svelte';
	import Menu from './Stages/Menu.svelte';
	import StartDraw from './Stages/StartDraw.svelte';
	import Modal from './Component/Modal.svelte';
	import AddGhost from './AddGhost.svelte';
	import Winners from './Stages/Winners.svelte';
	import ListBets from './Stages/ListBets.svelte';

	let showModal = false;

	let generalId = 1000;
	let allBets = new Set();
	let nBet = 0;

	let prize = 2535;
	let winners = [];
	let turn;

	let currStage = "menu";

	let darkMode = true;

	const createMostBetted = () => {
		let aux = []

		for(let i = 0; i < 50; i++) {aux.push(0);}

		return aux;
	}

	let mostBetted = createMostBetted();

	const newRandomBet = () => {
		let currBet = new Set();

		while(currBet.size < 5)
			var x = Math.floor(Math.random()*50) + 1;
			currBet.add(x);
			mostBetted[x-1] += 1;

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

		const iter = e.detail.values();

		for(let i = 0; i < 5; i++) {
			mostBetted[iter.values().next-1] += 1;
		}

	};

	const handleWinners = (e) => {
		winners = e.detail;
		currStage = "winners";
		nBet = 0;
	};

	const handleWinnersInfo = (e) => {
		turn = e.detail.turn;
		prize = e.detail.prize;
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

	const getMostBettedNum = () => {
		let mostBettedTups = [];
		for(let i = 0; i < 5; i++) {
			let highest = [-1, -1];
			for(let j = 0; j < 50; j++) {
				if(mostBetted[j] > highest[1]) {
					highest[1] = mostBetted[j];
					highest[0] = j+1;
				}
			}
			let best = (highest[0], highest[1]);

			mostBetted[best[0]-1] = -1;

			mostBettedTups.push(best);
		}

		return mostBettedTups;
	};

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

		{#if currStage === "list"}
			<Box {darkMode}>
				<ListBets {darkMode} {allBets} {nBet}></ListBets>
			</Box>
		{/if}

		{#if currStage === "draw"}
			<Box {darkMode}>
				<StartDraw {darkMode} {prize} {allBets} {nBet} draw={newRandomBet()} on:winnersList={handleWinners} on:winnersInfo={handleWinnersInfo}/>
			</Box>
		{/if}

		{#if currStage === "winners"}
			<Box {darkMode}>
				<Winners {darkMode} {winners} {allBets} {prize} {turn} />
				<!-- {getMostBettedNum} -->
			</Box>
		{/if}
		
	</div>
	
	<div class="buttons">
		<button on:click={handleDarkMode} class:dark={darkMode}>Dark Mode: {darkMode}</button>
		{#if currStage === "menu" || currStage === "list"}
			<button on:click={()=>{currStage="bet"}} class:dark={darkMode}>Apostar</button>
		{/if}

		{#if currStage === "bet"}
			<button on:click={()=>{currStage="menu"}} class:dark={darkMode}>Voltar ao menu</button>
			<button on:click|once={()=>showModal=true} class:dark={darkMode}>Adicionar participantes fantasma</button>
		{/if}

		{#if nBet > 0 && currStage !== "list" && currStage !== "draw"}
			<button on:click={()=>{currStage="list"}} class:dark={darkMode}>Ver apostas</button>
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