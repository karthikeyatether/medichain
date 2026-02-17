@echo off
TITLE Project Execution - mediChain

:MENU
CLS
ECHO ==========================================================
ECHO                  PROJECT EXECUTION MENU
ECHO ==========================================================
ECHO.
ECHO  [1] Start Client Only (Fast)
ECHO  [2] Deploy Contracts & Start Client (Running Migration)
ECHO  [3] Exit
ECHO.
SET /P M="Type 1, 2, or 3 then press ENTER: "

IF %M%==1 GOTO CLIENT_ONLY
IF %M%==2 GOTO DEPLOY_AND_CLIENT
IF %M%==3 GOTO EOF

:CLIENT_ONLY
CLS
ECHO Starting Client...
cd client
npm start
GOTO EOF

:DEPLOY_AND_CLIENT
CLS
ECHO Deploying Contracts...
cd truffle
call npm run migrate
IF %ERRORLEVEL% NEQ 0 (
    ECHO Migration failed! check if Ganache is running.
    PAUSE
    GOTO MENU
)
ECHO.
ECHO Starting Client...
cd ../client
npm start
GOTO EOF

:EOF
EXIT
