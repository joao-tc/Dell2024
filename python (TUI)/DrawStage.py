import random, os, time
from BetStage import allBets, getMostBettedNum

# Cria variaveis
draw = {-1}     # Set para os números sorteados
winners = []    # Lista com o id dos vencedores
prize = 500000
turn = 0

# Inicia o sorteio, com 5 números aleatorios
def startDraw():
    global draw
    
    while len(draw) < 6:
        draw.add(random.randint(1,50))

    draw.remove(-1)

# Verifica se existem vencedores
def checkForWinner():
    global winners, draw

    hasWinner = False

    for betId in allBets:
        currBet = allBets[betId]
        if currBet.getBet().issubset(draw):
            winners.append(betId)
            hasWinner = True

    return hasWinner

# Executa as rodadas de aposta até achar um vencedor ou chegar a 25 rodadas
def loopDraw():
    global draw, prize, winners, turn

    hasWinner = False
    while turn < 25:
        while len(draw) < turn+5:
            draw.add(random.randint(1,50))

        hasWinner = checkForWinner()

        if hasWinner:
            break
        else:
            prize*=1.05

            os.system('cls')
            print("Rodada de sorteio %d, nenhum vencedor." % turn)
            print("Premio acumulado para %.2f reais.\n" % prize)
            print("Números sorteados:", draw)
            time.sleep(1)

            turn+=1

    return winners

# Imprime os números mais votados
def printMostVoted():
    print("\n--/---/--\n")

    print("Nro apostado\tQtd de apostas".expandtabs())
    for num in getMostBettedNum():
        print("{}\t{}".format(num[0], num[1]).expandtabs(16))

# Imprime o nome e o id dos vencedores
def printWinners():
    global prize, winners, turn

    os.system('cls')

    if len(winners) == 0:
        print("Após %d rodadas de sorteio, não houveram vencedores." % turn)
        print("\nPremio acumulado em %.2f\n" % prize)
        print("Números sorteados:", draw)
        return
    
    print("Após {} rodada(s) de sorteio, o premio acumulou até {:.2f} reais.\n".format(turn, prize))

    print("Os números sorteados foram: ", draw)

    print("\nO premio será dividido para o(s) vencedor(es):")

    for i in winners:
        print("\nID da aposta:", i)
        print("Nome do vencedor:", allBets[i].getName())
        print("Números escolhidos:", allBets[i].getBet())    

# Função para controlae a fase de sorteio e apuração
def drawStage():
    global prize
    
    hasWinner = False

    startDraw()
    hasWinner = checkForWinner()

    if hasWinner:
        printWinners()
    else:
        prize*=1.05
        hasWinner = loopDraw()

    printWinners()
    printMostVoted()
