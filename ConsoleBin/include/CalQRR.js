include("Tektronix.js");
include("TestQRR.js")
include("CalGeneral.js")

//Константы
TEK = 0;
PICO = 1;
//

//Переменные
var Verify = 0;
var Osc = TEK;
//



//----------------------------------------------------------------------------------
function QPU_Cal_Idc_Verify(LSL_Port, TekPort)
{
	Verify = 1;
	
	QPU_Cal_Idc(LSL_Port, TekPort);
	
	Verify = 0;
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function QPU_Cal_Idc(QPU_Port,TekPort)
{	
	//Константы
	QPU_NID				= 0;			//Nid блока QPU
	N    				= 10;			//Количество точек калибровки
	QPU_CURRENT_MIN		= 100;			//Минимальный ток блока QPU
	QPU_CURRENT_MAX		= 500;			//Максимальный ток блока QPU
	R_SHUNT				= 1.00;			//Шунт для измерения тока
	
	
	//Переменные
	var TEK_Idc = 0;
	var Current = 0;
	var dI = 0;
	var Imin = 0;
	var PICO_Idc = 0;
	var Cal_Data = [];
	var I_error = [];
	var I_Osc = [];
	//
	
	dev.nid(QPU_NID);
	dev.Connect(QPU_Port);
	
	//Определение шага измениния тока
	dI = parseFloat((QPU_CURRENT_MAX-QPU_CURRENT_MIN)/(N-1)).toFixed(0);
	//

	if(Osc == TEK)
	{
		QPU_TekInit(TekPort);
		QPU_TekCursor(1);
	}
	
	
	//Сброс калибровочных коэфф до калибровки
	if(Verify==0)
	{
		dev.w(22,0);
		dev.w(23,1000);
		dev.w(24,0);
	}
	//
	

	for(i=0;i<N;i++)
	{	
		//Вчисление тока
		Current = parseInt(dI*i+QPU_CURRENT_MIN);
		
		if(Current>QPU_CURRENT_MAX)
			Current=QPU_CURRENT_MAX;
		//
		
		//Смена вертикальный шкалы осциллографа
		if(Osc == TEK)
		{
			QPU_TekRangeChange(Current);
		}
		//
		
	
		//Формируем импульс
		print("# " + (i + 1));
		
		QPU_Start(Current);
		sleep(10000);
		//
		
		
		//Измеряем остальные параметры
		if(Osc == PICO)
		{
			//Ожидание ввода значений с осциллографа PicoScope
			print("Enter force value (in mV):");
			PICO_Idc = Math.round(readline());
			print("----------------------------------");
			
			if (isNaN(PICO_Utm))
				break;
			
			//Вычисление погрешности
			I_error[i] = (Current-PICO_Idc)*100/Current;
			I_Osc[i] = PICO_Idc;
			
			//Сохраняем данные в файл
			Cal_Data[i]=(Current+";"+PICO_Idc);
		}
		else
		{
			//Считывание измеренное значение с осциллографа Tektronix
			TEK_Idc = parseFloat(TEK_Exec("cursor:vbars:hpos1?")*1000);
			
			//Вычисление погрешности
			I_error[i] = (Current-TEK_Idc)*100/Current;
			I_Osc[i] = TEK_Idc;
			
			//Сохраняем данные в файл
			Cal_Data[i]=(Current+";"+TEK_Idc);
		}
		
		save("data/qpu_cal_idc.csv",Cal_Data);
		//
	}
	
	//Вывод на экран погрешности измерения
	scattern(I_Osc, I_error, "Current (in A)", "Error (in %)", "Current relative error");
	//
	
	if(Verify==0)
	{
		//Вычисление корректировки
		I_corr = CGEN_GetCorrection2("qpu_cal_idc");
		
		//Сохранение калибровочных коэффициентов в память QPU
		dev.w(22,Math.round(I_corr[0]*1000000));
		dev.w(23,Math.round(I_corr[1]*1000));
		dev.w(24,Math.round(I_corr[2]));
		dev.c(200);
	}
}
//----------------------------------------------------------------------------------




//----------------------------------------------------------------------------------
function QPU_TekRangeChange(Current)
{
	R_SHUNT	= 1.00;
	
	//Смена вертикальный шкалы осциллографа
	Tek_Vmax = Current*R_SHUNT/1000;
	Tek_V_Range = Tek_Vmax/7;
	
	if(Tek_V_Range<=0.002){QPU_TEK_ChannelInit(1, 1, 0.002);}
	if((Tek_V_Range>0.002)&&(Tek_V_Range<=0.005)){QPU_TEK_ChannelInit(1, 1, 0.005);}
	if((Tek_V_Range>0.005)&&(Tek_V_Range<=0.01)){QPU_TEK_ChannelInit(1, 1, 0.01);}
	if((Tek_V_Range>0.01)&&(Tek_V_Range<=0.02)){QPU_TEK_ChannelInit(1, 1, 0.02);}
	if((Tek_V_Range>0.02)&&(Tek_V_Range<=0.05)){QPU_TEK_ChannelInit(1, 1, 0.05);}
	if((Tek_V_Range>0.05)&&(Tek_V_Range<=0.1)){QPU_TEK_ChannelInit(1, 1, 0.1);}
	if((Tek_V_Range>0.1)&&(Tek_V_Range<=0.2)){QPU_TEK_ChannelInit(1, 1, 0.2);}
	if((Tek_V_Range>0.2)&&(Tek_V_Range<=0.5)){QPU_TEK_ChannelInit(1, 1, 0.5);}
	if((Tek_V_Range>0.5)&&(Tek_V_Range<=1)){QPU_TEK_ChannelInit(1, 1, 1);}
	if((Tek_V_Range>1)&&(Tek_V_Range<=2)){QPU_TEK_ChannelInit(1, 1, 2);}
	if((Tek_V_Range>2)&&(Tek_V_Range<=5)){QPU_TEK_ChannelInit(1, 1, 5);}
	if(Tek_V_Range>5){QPU_TEK_ChannelInit(1, 1, 5);}
	
	sleep(1000);
	//
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function QPU_TEK_ChannelInit(Channel, Probe, Scale)
{
	TEK_Send("ch" + Channel + ":bandwidth on");
	TEK_Send("ch" + Channel + ":coupling dc");
	TEK_Send("ch" + Channel + ":invert on");
	TEK_Send("ch" + Channel + ":position -3");
	TEK_Send("ch" + Channel + ":probe " + Probe);
	TEK_Send("ch" + Channel + ":scale " + Scale);
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function QPU_TekInit(Port)
{
	//Tektronix config
	TEK_PortInit(Port);
	QPU_TEK_ChannelInit(1, 1, 0.02);//(channel,probe,scale) I dut
	TEK_TriggerInit(1, -0.06);//(channel,level) sync
	TEK_Horizontal(100e-6, -0.01);//(scale,position)
}
//----------------------------------------------------------------------------------


//----------------------------------------------------------------------------------
function QPU_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 -500e-6");
}
//----------------------------------------------------------------------------------