import os
from BetStage import allBets

# Função para limpar o terminal
def clear():
    os.system('cls')

    print("-> Visão do Operador <-\n")

# Imprime as informações de todas as apostas
def printBets():
    clear()

    for i in allBets:
        print("ID: {}\n{}".format(i, allBets[i]))

    input("Enter para voltar.")

# Função para controlar a visão do operador
def opStage():
    while True:
        clear()

        print("1) Ver todas as apostas\n2) Iniciar fase de sorteio")

        x = int(input())

        if x == 1: printBets()
        else: break
