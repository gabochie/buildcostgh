Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\user\Documents\GitHub\buildcostgh"
WshShell.Run "cmd /c set DATABASE_URL=postgresql://neondb_owner:npg_XNJxQM19CBIp@ep-broad-field-ah95iz15.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=60&pool_timeout=30&connection_limit=5&sslmode=require && set PORT=3111 && npx next dev --port 3111 --webpack", 0, False
