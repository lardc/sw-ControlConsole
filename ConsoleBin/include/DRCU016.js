include("Tektronix.js");
include("AddCalDCU016.js")
include("Sic_GetData.js")

// CAN Nomber
UseCAN = 0;
CANadap = 0;
CAN = 5;
QSU  = 10;
//DCU1 = 160;
//DCU2 = 161;
//DCU3 = 162;
portDevice = 0;

// Данные активаных блоков
Unit = 0;
UnitEn = 2;


// Calibration setup parameters
cal_Rshunt = 1000;	// uOhm
cal_Points = 10;
cal_Iterations = 1;
cal_UseAvg = 1;

// CurrentArray
cal_IdMin = 100;	
cal_IdMax = 1100;
cal_IdStp = 100;

// VoltageRete
cal_IntPsVmin = 80;	// V
cal_IntPsVmax = 120;

//CurrentRate
CurrentRateNTest = 0;
CurrentRateN = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
CurrentRate = [0.167, 0.25, 0.334, 0.834, 1.667, 2.5, 3.334, 5, 8.334, 10, 16.667]; // in A/us 1, 1.5, 2, 5, 10, 15, 20, 30, 50, 60, 100


// Counters
cal_CntTotal = 0;
cal_CntDone = 0;

// Channels
cal_chMeasureId = 1;
cal_chSync = 3;

// Results storage
cal_Id = [];
cal_Idset = [];
cal_Irate = [];
cal_VintPS = [];

// Tektronix data
cal_IdSc = [];
cal_Irate = [];

// Relative error
cal_IdErr = [];
cal_IdsetErr = [];
cal_Irate = [];

// Correction
cal_IdCorr = [];
cal_IdsetCorr = [];
cal_IrateCorr = [];

// Data arrays
cdcu_scatter = [];


//------------------------------------------------------------------------------------------------------------------------------------------
// Включение всех блоков DCU для калибровки
function ALL_DCU_SW()		
{
	print("UseCANadap ? (press 'y' or 'n')");
	var key;
		do
		{
			key = readkey();
		}
	while (key != "y" && key != "n");
	if (key == "y")
		UseCAN = 1;
	else if (key == "n")
		UseCAN = 0	
	if (UseCAN == 1)
		{ 
		print("Enter number CANadap")
		CANadap = readline();
		dev.co(CANadap);
		print("Enter number CAN QSU")
		QSU = readline();
		dev.nid(QSU);
		print("Enter number use unit")
		UnitEn = readline();
		for (var a = 0; a < UnitEn ; a++)
			{
			Unit = dev.r(12 + a);
			dev.nid(Unit);
			dev.w(140,1);
			dev.c(1);
			dev.nid(QSU);
			} 
		portDevice = Unit;
		}
	else
		{
		print("Enter number RS232")
		portDevice = readline();
		dev.co(portDevice);
		}	
} 
//------------------------------------------------------------------------------------------------------------------------------------------
//блок настройки осцилограффа и выходов
function CAL_Init(portTek, channelMeasureId)
{
	if (channelMeasureId < 1 || channelMeasureId > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	cal_chMeasureId = channelMeasureId;

	// Init device port
	
	
	if(UseCAN == 1)
		{
		if( CANadap == 0)	
			{
			print("Namber CANadap ?");
			CANadap = readline();
			print("CANadap = " + CANadap );
			dev.Connect(CANadap);
			dev.nid(portDevice);
			}
		else
			print("CANadap = " + CANadap );
			dev.Connect(CANadap);
			dev.nid(portDevice);
		}	
	

	else
	{
		dev.Connect(portDevice);
	}	
	
	// Init Tektronix port
	TEK_PortInit(portTek);
	
	// Tektronix init
	for (var i = 1; i <= 4; i++)
	{
		if (i == channelMeasureId)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//Блок формирования одиночного импульса
function DRCU_Pulse(Current, CurrentRate)
{
	if( UnitEn == 1) // Когда проверяется 1 блок
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
	else			// Когда проверяется более 1 блока
	{
		for(var i = 0; i < UnitEn; i++)
		{
			dev.nid(10);
			Unit = dev.r(12 + i);  
			CONFIG_UNIT(Unit, Current, CurrentRate);

		}

		dev.nid(QSU);
		sleep(200);
		dev.c(22);
		dev.nid(Unit);
		while (dev.r(197) == 6)
			{
				sleep(500);
			}
	}
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//Блок верификации амплитуды тока (компенсация) 

function CAL_VerifyId(CurrentRateNTest)
{
	//Reset values
	CAL_ResetA();

	// Tektronix init
	CAL_TekInitId();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IdMin, cal_IdMax, cal_IdStp);
 
	if (CAL_CollectId(CurrentArray, cal_Iterations))
		{
		CAL_SaveId("DCU_Id_fixed");
		CAL_SaveId("DCU_Idset_fixed");

		// Plot relative error distribution
		scattern(cal_IdSc, cal_IdErr, "Current (in A)", "Error (in %)", "Current relative error");
		scattern(cal_IdSc, cal_IdsetErr, "Current (in A)", "Error (in %)", "Current set relative error");
		}
	}	

//-------------------------------------------------------------------------------------------------------------------------------------------
//Блок верификации скорости спада

function CAL_VerifyIrate(CurrentRateNTest)
{		
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInitIrate();
	
	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IdMin, cal_IdMax, cal_IdStp);
	CAL_CollectIrate(CurrentArray, cal_Iterations, CurrentRateNTest);		
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//Блок калибровки амплитуды тока (компенсация) (Для 1 блока)

function CAL_CalibrateId(CurrentRateNTest)
{		
	CAL_ResetA();
	CAL_ResetIdCal();
	CAL_ResetIdsetCal();
	
	// Tektronix init
	CAL_TekInitId();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IdMin, cal_IdMax, cal_IdStp);

	if (CAL_CollectId(CurrentArray, cal_Iterations, CurrentRateNTest))
	{
		CAL_SaveId("DCU_Id");
		CAL_SaveIdset("DCU_Idset");

		// Plot relative error distribution
		scattern(cal_IdSc, cal_IdErr, "Current (in A)", "Error (in %)", "Current relative error");
		scattern(cal_IdSc, cal_IdsetErr, "Current (in A)", "Error (in %)", "Current set relative error");

		// Calculate correction
		cal_IdCorr = CGEN_GetCorrection2("DCU_Id");
		CAL_SetCoefId(cal_IdCorr[0], cal_IdCorr[1], cal_IdCorr[2]);
		CAL_PrintCoefId();
		
		cal_IdsetCorr = CGEN_GetCorrection2("DCU_Idset");
		CAL_SetCoefIdset(cal_IdsetCorr[0], cal_IdsetCorr[1], cal_IdsetCorr[2]);
		CAL_PrintCoefIdset();
	}
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//Блок калибровки скорости спада (Для 1 блока)

function CAL_CalibrateIrate(CurrentRateNTest)
{
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInitIrate();
	
	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IdMin, cal_IdMax, cal_IdStp);

	if (CAL_CompensationIrate(CurrentArray, CurrentRateNTest))
	{
		CAL_SaveVintPS("DCU_VintPS");

		// Calculate correction
		cal_IrateCorr = CGEN_GetCorrection("DCU_VintPS");
		CAL_SetCoefIrateCompens(cal_IrateCorr[0], cal_IrateCorr[1]);
		CAL_PrintCoefIrateCompens();
	}	
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//Импульс управления (Когда проверяется 1 блок)
function DRCU_Debug(PWM, Range)
{
	dev.w(150, Range);
	dev.c(59);
	dev.w(150, PWM);
	dev.w(151, PWM);
	dev.c(60);
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//Ресурсный тест (Когда проверяется 1 блок)

function DRCU_Test(N)

{
	for (var i = 0; i < N; i++)
	{
		for (var j = 0; j < 11; j++)
		{
			p("#" + (i * 11 + j) + " / "+ (i + 1) );
			p("№ dI/dt = " + CurrentRateArray[j]);
			p("----------------");
			p("");
			
			if(!DRCU_Pulse(CurrentTest, CurrentRateArray[j]))
				return;
			
			if (anykey())
				return;
		}
	}
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//одиночное включение-выключение формирования flyback (Когда проверяется 1 блок)

function DRCU_SinglePS(delay)
{ 
dev.w(150,0);
dev.c(55);
dev.w(150,1);
 print("Включение");
 dev.c(54);
 
 sleep (delay);
dev.w(150,0);
 print("Выключение");
 dev.c(54);
 sleep (100);
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//Включение разрядки БП (Когда проверяется 1 блок)

function DRCU_PSDischarge() //Включение разрядки БП
{
	dev.w(150,0);
	dev.c(55);
	
while(!anykey())

	{
	dev.w(150,1);
	dev.c(55);
	sleep(100);
	}

	dev.w(150,0);
	dev.c(55);
	
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//Выставление напряжения на внутреннем источнике (Когда проверяется 1 блок)


function DRCU_PSSetpoint(voltage)
{
	dev.w(130,voltage*10);

	while(!anykey())
	{
		p(dev.r(201));
		sleep(2000);
	}
	dev.w(130,0);
}

//-------------------------------------------------------------------------------------------------------------------------------------------
