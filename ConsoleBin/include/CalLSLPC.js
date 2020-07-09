include("Tektronix.js");
include("TestLSLPC.js")
include("CalGeneral.js")

//Константы
TEK = 0;
PICO = 1;
//

//Переменные
var Verify = 0;
var Osc = PICO;
//


//----------------------------------------------------------------------------------
function LSLPC_Cal_I_Verify(LSLPC_Port, TekPort, Range)
{
	Verify = 1;
	
	LSLPC_Cal_I(LSLPC_Port, TekPort, Range);
	
	Verify = 0;
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSLPC_Cal_I(LSLPC_Port, TekPort, Range)
{	
	//Переменные
	var TEK_Itm = 0;
	var Current = 0;
	var dI = 0;
	var Cal_Data = [];
	var I_error = [];
	var LSLPC_I = [];
	var Current=0;
	var Imin=0;
	
	//Константы
	ITM_R_SHUNT					= 0.75;
	LSLPC_I_MIN					= 200;
	LSLPC_I_MAX					= 1500;
	LSLPC_Range_THRESHOLD		= 1500;
	N							= 10;
	//
	
	//Сброс старых коэффициентов
	if(Verify==0)
	{
		if(Range==0)
		{
			dev.w(4,0);
			dev.w(5,0);
		}
		
		if(Range==1)
		{
			dev.w(6,0);
			dev.w(7,0);
		}
	}
	//
	
	dev.Connect(LSLPC_Port);	
	
	if(Osc == TEK)
	{
		LSL_TekInit(TekPort);
		LSL_TekCursor(1);
	}

	
	if(Range==0)
	{
		Imin = LSLPC_I_MIN;
		dI = parseFloat((LSLPC_Range_THRESHOLD-1-Imin)/(N-1)).toFixed(0);
	}
	
	if(Range==1)
	{
		Imin = LSLPC_Range_THRESHOLD;
		dI = parseFloat((LSLPC_I_MAX-Imin)/(N-1)).toFixed(0);
	}
	
	for(i=0;i<N;i++)
	{			
		Current = parseInt(dI*i+Imin);
	
		if((Range==0)&&(Current>(LSLPC_Range_THRESHOLD-1)))
		{
			Current = LSLPC_Range_THRESHOLD-1;
		}
		
		if((Range==1)&&(Current>LSLPC_I_MAX))
		{
			Current = LSLPC_I_MAX;
		}

		//Смена вертикальный шкалы осциллографа
		if(Osc == TEK)
		{
			LSL_TekRangeChange(Current,ITM_R_SHUNT);
		}
	
		//Формируем импульс
		LSLPC_Pulse(Current);
		
		if(Osc == PICO)
		{
			//Измеряем остальные параметры
			print("Enter force value (in mV):");
			PICO_Itm = Math.round(readline()/ITM_R_SHUNT);
			print("----------------------------------");

			if (isNaN(PICO_Itm))
			return;
		}
		
		
		if(Osc == TEK)
		{
			TEK_Itm = parseFloat(TEK_Exec("cursor:vbars:hpos1?")).toFixed(3)*1000/ITM_R_SHUNT;
		}
		//
		
		if(Osc == TEK)
		{
			I_error[i] = (Current-TEK_Itm)*100/TEK_Itm;
			LSLPC_I[i] = TEK_Itm;
			
			//Сохраняем данные в файл
			Cal_Data[i]=(TEK_Itm+";"+Current);
			save("data/lsl_cal_seti.csv",Cal_Data);
		}
		else
		{
			I_error[i] = (Current-PICO_Itm)*100/PICO_Itm;
			LSLPC_I[i] = PICO_Itm;
			
			//Сохраняем данные в файл
			Cal_Data[i]=(PICO_Itm+";"+Current);
			save("data/lsl_cal_seti.csv",Cal_Data);
		}
		//
	}
	
	if(Range==0)
	{
		scattern(LSLPC_I, I_error, "Current (in A)", "Error (in %)", "Current relative error (Range 0)");

		if(Verify==0)
		{
			//Вычисление корректировки
			I_corr = CGEN_GetCorrection("lsl_cal_seti");
			
			//Сохранение калибровочных коэффициентов в память LSLH_Utm
			dev.w(4,Math.round(I_corr[0]*1000));
			dev.ws(5,Math.round(I_corr[1]));
			dev.c(200);
		}
	}
	
	if(Range==1)
	{
		scattern(LSLPC_I, I_error, "Current (in A)", "Error (in %)", "Current relative error (Range 1)");

		if(Verify==0)
		{
			//Вычисление корректировки
			I_corr = CGEN_GetCorrection("lsl_cal_seti");
			
			//Сохранение калибровочных коэффициентов в память LSLH_Utm
			dev.w(6,Math.round(I_corr[0]*1000));
			dev.ws(7,Math.round(I_corr[1]));
			dev.c(200);
		}
	}
}
//----------------------------------------------------------------------------------





//----------------------------------------------------------------------------------
function LSL_TekRangeChange(Current, Rshunt)
{
	//Смена вертикальный шкалы осциллографа
	Tek_Vmax = Current*Rshunt/1000;
	Tek_V_Range = Tek_Vmax/7;
	
	if(Tek_V_Range<=0.002){LSL_TEK_ChannelInit(1, 1, 0.002);}
	if((Tek_V_Range>0.002)&&(Tek_V_Range<=0.005)){LSL_TEK_ChannelInit(1, 1, 0.005);}
	if((Tek_V_Range>0.005)&&(Tek_V_Range<=0.01)){LSL_TEK_ChannelInit(1, 1, 0.01);}
	if((Tek_V_Range>0.01)&&(Tek_V_Range<=0.02)){LSL_TEK_ChannelInit(1, 1, 0.02);}
	if((Tek_V_Range>0.02)&&(Tek_V_Range<=0.05)){LSL_TEK_ChannelInit(1, 1, 0.05);}
	if((Tek_V_Range>0.05)&&(Tek_V_Range<=0.1)){LSL_TEK_ChannelInit(1, 1, 0.1);}
	if((Tek_V_Range>0.1)&&(Tek_V_Range<=0.2)){LSL_TEK_ChannelInit(1, 1, 0.2);}
	if((Tek_V_Range>0.2)&&(Tek_V_Range<=0.5)){LSL_TEK_ChannelInit(1, 1, 0.5);}
	if((Tek_V_Range>0.5)&&(Tek_V_Range<=1)){LSL_TEK_ChannelInit(1, 1, 1);}
	if((Tek_V_Range>1)&&(Tek_V_Range<=2)){LSL_TEK_ChannelInit(1, 1, 2);}
	if((Tek_V_Range>2)&&(Tek_V_Range<=5)){LSL_TEK_ChannelInit(1, 1, 5);}
	if(Tek_V_Range>5){LSL_TEK_ChannelInit(1, 1, 5);}
	
	sleep(1000);
	//
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_TEK_ChannelInit(Channel, Probe, Scale)
{
	TEK_Send("ch" + Channel + ":bandwidth on");
	TEK_Send("ch" + Channel + ":coupling dc");
	TEK_Send("ch" + Channel + ":invert off");
	TEK_Send("ch" + Channel + ":position -4");
	TEK_Send("ch" + Channel + ":probe " + Probe);
	TEK_Send("ch" + Channel + ":scale " + Scale);
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_TekInit(Port)
{
	//Tektronix config
	TEK_PortInit(Port);
	LSL_TEK_ChannelInit(1, 1, 0.2);//(channel,probe,scale) I dut
	LSL_TEK_ChannelInit(2, 1, 0.5);//(channel,probe,scale) U dut
	LSL_TEK_ChannelInit(3, 1, 2);//(channel,probe,scale) sync
	TEK_TriggerInit(3, 2.5);//(channel,level) sync
	TEK_Horizontal(2.5e-3, 0);//(scale,position)
}
//----------------------------------------------------------------------------------


//----------------------------------------------------------------------------------
function LSL_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 0");
}
//----------------------------------------------------------------------------------