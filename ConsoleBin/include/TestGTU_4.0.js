include("PrintStatus.js")
include("TestBVT.js")

gtu_vg_lim	= 12000;
gtu_vd_lim	= 12000;
gtu_ig_lim 	= 1000;
gtu_id_lim	= 1000;

gtu_diag = 1;
gtu_plot = 0;

gtu_igt = [];
gtu_vgt = [];
gtu_res = [];
gtu_ih = [];
gtu_il = [];

function GTU_Kelvin()
{
	if (gtu_diag) print("#Kelvin test");
	dev.c(100);
	while(dev.r(192) == 3) sleep(50);
	
	if (gtu_diag)
	{
		print("#Test complete code: " + dev.r(197));
		if (dev.r(197) == 2) print("#Problem: " + dev.r(196));
		
		print("CC to CP (211): " + dev.r(211));
		print("AP to CP (212): " + dev.r(212));
		print("CP to AP (213): " + dev.r(213));
		print("AC to CC (214): " + dev.r(214));
	}
	else
	{
		if (dev.r(211) == 1 && dev.r(212) == 0 && dev.r(213) == 0 && dev.r(214) == 1)
			print("Kelvin  : OK");
		else
			print("Kelvin  : FAIL");
	}

	if (gtu_diag) 
	{
		if ((dev.r(211) == 1) && (dev.r(212) == 0) && (dev.r(213) == 0) && (dev.r(214) == 1))
			print("Test result: OK");
		else
			print("Test result: FAILED");
	}
}

function GTU_Gate()
{
	dev.w(128, gtu_vd_lim);
	dev.w(129, gtu_id_lim);
	dev.w(130, gtu_vg_lim);
	dev.w(131, gtu_ig_lim);
	
	dev.c(101);
	
	while(dev.r(192) == 4) sleep(50);
	
	if (gtu_diag)
	{
		print("#Test complete code: " + dev.r(197));
		if (dev.r(197) == 2) print("#Problem: " + dev.r(196));
	}
	
	print("Igt,  mA: " + dev.r(199));
	print("Vgt,  mV: " + dev.r(200));
	
	gtu_igt.push(dev.r(199));
	gtu_vgt.push(dev.r(200));
	
	if (gtu_plot)
	{
		plot(dev.rafs(1), 1, 0);
		plot(dev.rafs(2), 1, 0);
	}
}

function GTU_Res()
{
	if (gtu_diag) print("\n#Gate resistance");
	dev.c(104);
	while(dev.r(192) == 7) sleep(50);
	
	if (gtu_diag)
	{
		print("#Test complete code: " + dev.r(197));
		if (dev.r(197) == 2) print("#Problem: " + dev.r(196));
	}
	
	print("Res, Ohm: " + dev.r(203) / 10);
	
	gtu_res.push(dev.r(203) / 10);
}

function GTU_Holding()
{
	if (gtu_diag) print("\n#Holding current");

	dev.w(128, gtu_vd_lim);
	dev.w(129, gtu_id_lim);
	dev.w(130, gtu_vg_lim);
	dev.w(131, gtu_ig_lim);
	
	dev.c(102);
	
	while(dev.r(192) == 5) sleep(50);
	
	if (gtu_diag)
	{
		print("#Test complete code: " + dev.r(197));
		if (dev.r(197) == 2) print("#Problem: " + dev.r(196));
	}
	
	print("Ih,   mA: " + dev.r(201));
	
	gtu_ih.push(dev.r(201));
	
	if (gtu_plot) plot(dev.rafs(1), 1, 0);
}

function GTU_Latching()
{
	if (gtu_diag) print("\n#Latching current");
	
	dev.w(128, gtu_vd_lim);
	dev.w(129, gtu_id_lim);
	dev.w(130, gtu_vg_lim);
	dev.w(131, gtu_ig_lim);
	
	dev.c(103);
	
	while(dev.r(192) == 6) sleep(50);
	
	if (gtu_diag)
	{
		print("#Test complete code: " + dev.r(197));
		if (dev.r(197) == 2) print("#Problem: " + dev.r(196));
	}
	
	print("Il,   mA: " + dev.r(202));
	
	gtu_il.push(dev.r(202));
}

function GTU_Vgnt(DirectVoltage, DirectCurrent)
{
	if (gtu_diag) print("\n#Not turn on gate voltage");
	
	// Проверка начальных состояний блоков
	dev.nid(4);
	if (dev.r(192) != 4)
	{
		print("BVT not ready. State: " + dev.r(192));
		return;
	}
	dev.nid(3);
	if (dev.r(192) != 0)
	{
		print("GTU not ready. State: " + dev.r(192));
		return;
	}
	
	// Конфигурация BVT
	dev.nid(4);
	dev.w(128, 3);					// Тип теста
	dev.w(130, DirectCurrent * 10);	// Ток отсечки, мА
	dev.w(131, DirectVoltage);		// Напряжение испытания, В
	dev.w(132, 60000);				// Максимальное время приложения напряжения испытания, мсек
	dev.w(133, 20);					// Скорость выхода на заданное напряжение, кВ/сек
	dev.w(134, 200);				// Стартовое напряжение, в В
	
	// Конфигурация GTU
	dev.nid(3);
	dev.w(128, gtu_vd_lim);
	dev.w(129, gtu_id_lim);
	dev.w(130, gtu_vg_lim);
	dev.w(131, gtu_ig_lim);
	
	// Запуск формирования прямого напряжения
	dev.nid(4);
	if (gtu_diag) print("Start of generating direct voltage " + DirectVoltage + "V");
	dev.c(100);
	while((dev.r(192) == 5) && (dev.r(201) == 0))
		sleep(100);
	
	if (dev.r(192) != 5)
	{
		print("BVT failed to reach direct voltage. Block state: " + dev.r(192));
		return;
	}
	else
		if (gtu_diag) print("BVT reached configured voltage");
	
	// Запсук формирования напряжения в цепи управления
	dev.nid(3);
	dev.c(106);
	
	// Ожидание завершения измерения
	var gtu_state, bvt_state;
	do
	{
		dev.nid(4);
		bvt_state = dev.r(192);
		dev.nid(3);
		gtu_state = dev.r(192);
		sleep(100);
	}
	while(bvt_state == 5 && gtu_state == 9);
	
	// Проверка необходимости принудительной отановки BVT
	sleep(100);
	dev.nid(4);
	if (dev.r(192) == 5)
	{
		dev.c(101);
		print("BVT forced to stop");
	}
	
	// Считывание результата
	dev.nid(3)
	if (gtu_diag)
	{
		print("#Test complete code: " + dev.r(197));
		if (dev.r(197) == 2) print("#Problem: " + dev.r(196));
	}
	
	print("Vgnt, mV: " + dev.r(205));
	print("Ignt, mA: " + dev.r(206));
}

function GTU_ResetA()
{
	gtu_igt = [];
	gtu_vgt = [];
	gtu_res = [];
	gtu_ih = [];
	gtu_il = [];
}

function GTU_All(Num, Pause)
{
	try
	{
		for (var i = 0; i < Num; i++)
		{
			if (Num > 1) print("Test #" + (i + 1));
			
			GTU_Kelvin();
			GTU_Gate();
			GTU_Res();
			GTU_Holding();
			GTU_Latching();
			
			print("-------------");
			
			sleep(Pause);
			if (anykey()) return;
		}
	}
	catch (e)
	{
		print("\n#Operation unsuccessful");
		print("#Status");
		PrintStatus();
	}
}

function GTU_Run(Voltage)
{
	dev.nid(1);
	dev.c(111);
	
	dev.nid(3);
	GTU_Kelvin();
	GTU_Gate();
	GTU_Holding();
	GTU_Latching();
	
	dev.nid(1);
	dev.c(117);
	GTU_Vgnt(Voltage, 200);
	
	dev.nid(1);
	dev.c(110);
}

function GTU_SetKelvin(High, Low)
{
	dev.w(160, High);
	dev.w(161, Low);
	dev.c(13);
}

function GTU_Plot()
{
	plot(gtu_igt, 1, 0); sleep(200);
	plot(gtu_vgt, 1, 0); sleep(200);
	plot(gtu_res, 1, 0); sleep(200);
	plot(gtu_ih, 1, 0); sleep(200);
	plot(gtu_il, 1, 0);	
}

function GTU_PulseX(Time, Current, CMD)
{
	dev.w(140, Current);

	dev.c(CMD);
	
	var state;
	do
	{
		state = dev.r(192);
		sleep(50);
	}
	while (state >= 3);
	
	print("Ical, mA: " + dev.r(204));
	print("Vcal, mV: " + dev.r(205));
}

function GTU_SavePlots()
{
	var a;
	
	pl(a = dev.rafs(1));
	save('vg.csv', a);
	sleep(200);
	
	pl(a = dev.rafs(2));
	save('ig.csv', a);
	sleep(200);
	
	pl(a = dev.rafs(3));
	save('vd.csv', a);
	sleep(200);
	
	pl(a = dev.rafs(4));
	save('id.csv', a);
}

function GTU_PulseGate(Time, Current)
{
	GTU_PulseX(Time, Current, 110);
}

function GTU_PulsePow(Time, Current)
{
	GTU_PulseX(Time, Current, 111);
}

function GTU_ResourceTest(N)
{
	gtu_igt   = [];
	gtu_vgt   = [];
	gtu_res   = [];
	gtu_hold  = [];
	gtu_latch = [];
	
	
	for(i=0;i<N;i++)
	{
		print("-----------------------------------");
		GTU_Kelvin();
		print("");
		
		GTU_Gate();
		print("");
		gtu_igt[i] = dev.r(199);
		gtu_vgt[i] = dev.r(200);
		
		
		GTU_Res();
		print("");
		gtu_res[i] = dev.r(203);
		
		
		GTU_Holding();
		print("");
		gtu_hold[i] = dev.r(201);
		
		
		GTU_Latching();
		print("");
		gtu_latch[i] = dev.r(202);
		
		print("N = " + i);
		
		sleep(10000);
	}
	//CGEN_SaveArrays(GTU_ResourceTest, gtu_igt, gtu_vgt, gtu_res, gtu_hold, gtu_latch);
}

function GTU_HeatingTest(Voltage, Current)
{
	var i = 0;
	
	dev.w(10,0);
	dev.w(11,0);
	dev.w(61,100);
	dev.w(130,Voltage);
	dev.w(131,Current);
	
	dev.c(107);
	
	while(1)
	{
		i++;
		
		sleep(1000);
		print("N = "+i);
		
		if(anykey())
		{
			dev.c(105);
			break;
		}
	}
}






