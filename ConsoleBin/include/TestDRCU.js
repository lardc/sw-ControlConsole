include("PrintStatus.js")

CurrentRateArray = [50, 75, 100, 250, 500, 750, 1000, 1500, 2500, 3000, 5000]; // A/us * 100
CurrentTest = 500;	// A
bi = 0; //счётчик
function DRCU_Debug(Current, Range)
{
	dev.w(150, Range);
	dev.c(59);
	dev.w(150, Current);
	dev.w(151, Current);
	dev.c(60);
}

function DRCU_Pulse(Current, CurrentRate)
{
	dev.w(128, Current);
	dev.w(129, CurrentRate);
	
	if(dev.r(192) == 3)
	{
		dev.c(100);
		
		while(dev.r(192) != 4)
		{
			if(dev.r(192) == 1)
			{
				PrintStatus();
				return 0;
			}
		}
		
		dev.c(101);
		sleep(50);
		
		while(dev.r(192) != 3)
		{
			if(dev.r(192) == 1)
			{
				PrintStatus();
				return 0;
			}
		}
	}
	else
		if(dev.r(192) == 1)
		{
			PrintStatus();
			return 0;
		}
	
	return 1;
}
//---------------------------------------------

function DRCU_Test(N)
{
	for (var i = 0; i < N; i++)
	{
		for (var j = 0; j < 11; j++)
		{
			p("#" + (i * 11 + j));
			p("dI/dt = " + CurrentRateArray[j] / 100 + "A/us")
			p("----------------");
			p("");
			
			if(!DRCU_Pulse(CurrentTest, CurrentRateArray[j]))
				return;
			
			if (anykey())
				return;
		}
	}
}

function DRCU_InPsVoltageSet(CurrentRate, Voltage)
{
	switch(CurrentRate * 100)
	{
		case 50:
			dev.w(52, Voltage * 10);
			break;
		case 75:
			dev.w(53, Voltage * 10);
			break;
		case 100:
			dev.w(54, Voltage * 10);
			break;
		case 250:
			dev.w(55, Voltage * 10);
			break;
		case 500:
			dev.w(56, Voltage * 10);
			break;
		case 750:
			dev.w(57, Voltage * 10);
			break;
		case 1000:
			dev.w(58, Voltage * 10);
			break;
		case 1500:
			dev.w(59, Voltage * 10);
			break;
		case 2500:
			dev.w(60, Voltage * 10);
			break;
		case 3000:
			dev.w(61, Voltage * 10);
			break;
		case 5000:
			dev.w(62, Voltage * 10);
			break;
	}
}
//---------------------------------------------

function DRCU_IntPS() //периодическое включение-выключение формирования flyback
{
while(!anykey())
{
if (bi==1) {bi = 0;}  
else bi = 1; 
dev.w(150,bi);
 //p(bi);
 dev.c(54);
 sleep (5);}
}

function DRCU_SinglePS(delay) //одиночное включение-выключение формирования flyback
{ 
dev.w(150,0);
dev.c(55);
dev.w(150,1);
 p(dev.r(150));
 dev.c(54);
 
 sleep (delay);
dev.w(150,0);
 p(dev.r(150));
 dev.c(54);
 sleep (100);
}

function CAL_DCUTestV(voltage, current, rate){
	dev.w(130,voltage*10);
	DRCU_Pulse(current,rate);
}

function DRCU_CurrentTest(){
plot(dev.rafs(1), 1, 0);
 while (dev.r(202) > 7000) {
 DRCU_Pulse(500, 2000); 
 sleep (3000); 
 if (anykey()) break
 }
 plot(dev.rafs(1), 1, 0);
}