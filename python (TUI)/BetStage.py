import os, random

# Classe feita para criar e lidar com as apostas

# Cria variaveis
allBets = {}    # Dicionario para acessar as apostas pelo id
betId = 1000
mostBetted = [0 for _ in range(50)] # Lista dos números mais apostados

# Objeto para as apostas
class Bet():
    name = ""
    cpf = ""
    Bet = {}
    
    def __init__(self, name, cpf, bet):
        self.name = name
        self.cpf = cpf
        self.bet = bet

    def getName(self):
        return self.name

    def getCpf(self):
        return self.cpf
    
    def getBet(self):
        return self.bet
    
    def __str__(self):
        aux = "Name: {}\nCPF: {}\nBet: {}\n".format(self.name, self.cpf, self.bet)
        return aux

# Função para criar um Set com 5 numeros de 1 a 50
def randomBet():
    global mostBetted

    x = random.randint(1, 50)
    aux = {x}
    mostBetted[x-1] += 1
    while len(aux) < 5:
        x = random.randint(1,50)
        aux.add(x)
        mostBetted[x-1] += 1
    return aux

# Inicia os objetos de teste, com apostas aleatórias
def initTest():
    global betId
    currName = "Name"
    currCpf = "CPF"
    for i in range(20):
        allBets[betId] = Bet((currName + str(i)), (currCpf + str(i)), randomBet())
        betId+=1

# Função para escolher os números apostados manualmente
def manualBet():
    os.system('cls')

    validNums = {i for i in range(1,51)}
    currBet = {-1}

    while len(currBet) < 6:
        os.system('cls')
        print("Números disponíveis:\n")
        print(validNums)

        x = int(input("\nEscolha um número: "))
        currBet.add(x)
        validNums.remove(x)
        mostBetted[x-1] += 1
    currBet.remove(-1)

    return currBet

# Retorna uma Tupla com os 5 números mais escolhidos e o número de vezes que foram escolhidos
def getMostBettedNum():
    global mostBetted

    mostBettedTups = []
    
    for _ in range(5):
        highest = [-1, -1]
        for i in range(len(mostBetted)):
            if mostBetted[i] >= highest[1]:
                highest[1] = mostBetted[i]
                highest[0] = i+1
        
        best = (highest[0], highest[1])

        mostBetted[best[0]-1] = -1

        mostBettedTups.append(best)

    return mostBettedTups


# Cria uma nova aposta de acordo com o usuário
def newBet():
    global betId
    os.system('cls')

    currName = input("Nome: ")
    currCpf = input("CPF: ")

    os.system('cls')

    print("1) Aposta manual\n2) Aposta automática")
    x = int(input())

    if x == 1: currBet = manualBet() 
    else: currBet = randomBet()

    allBets[betId] = Bet(currName, currCpf, currBet)
    betId+=1

# Função para controlar a fase de apostas
def betStage():
    while True:
        newBet()
        os.system('cls')
        print("Aposta salva.")

        x = int(input("\nRealizar nova aposta?\n1) Sim\n2) Não\n"))

        if x == 2: break
