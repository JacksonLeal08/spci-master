import datetime
import subprocess
import sys

now = datetime.datetime.now().strftime('%d-%m-%Y %H:%M')
desc = sys.argv[1] if len(sys.argv) > 1 else 'Gestao de Prazos, Garantias, Mapa de Cotacoes, Aditivos e Recusa de OS'
commit_msg = f'- {desc} "alteracao" {now}'

print(f"Executando commit: {commit_msg}")
subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
