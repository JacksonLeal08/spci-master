import datetime
import subprocess

now = datetime.datetime.now().strftime('%d-%m-%Y %H:%M')
commit_msg = f'- Envio Hibrido de Romaneio em PDF via WhatsApp e Download "alteracao" {now}'

print(f"Executando commit: {commit_msg}")
subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
