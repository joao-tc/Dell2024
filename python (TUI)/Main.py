from BetStage import initTest, betStage
from OpStage import opStage
from DrawStage import drawStage

# Classe principal, feita principalmente para lidar com import circular

# Inicia casos de teste
initTest()

# Inicia a fase de apostas
betStage()

# Inicia o terminal do operador
opStage()

# Inicia a fase de sorteio/premiação
drawStage()