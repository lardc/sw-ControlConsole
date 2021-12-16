include("PrintStatus.js")

tou_print = 1;
tou_printError = 0;

// Timings
ctou_t_on = [];
ctou_t_gd = [];

// Status check
function _TOU_Active()
{
	return (dev.r(192) == 5);
}

// Cycle test
function TOU_DBG(Min, Max, Step)
{
	tou_min_current = Min;
	tou_max_current = Max;
	tou_step_current = Step;
	
	for(var i = tou_min_current; i < tou_max_current; i = i + tou_step_current)
	{
		dev.w(128, i);
 		dev.c(24);
 		print("Задание " + i);
 		print("Измерил блок " + dev.r(201));
 		if (anykey()) return;
 		sleep(1000);
 		while (dev.r(200) < 299)
 			sleep(100);
	}
	
}

// One measure [A]
function TOU_Measure(Current)
{
	dev.w(128, Current);
	dev.c(100);
	while (_TOU_Active())
		sleep(100);
	
	if (dev.r(197) == 1)
	{
		TOU_getVal();
		TOU_getError();
	}
	else
	{
		if (tou_printError)
		{
		print("OpResult fail");
		PrintStatus();	
		}		
	}
}

// Resourse measurements
function TOU_ResourceTest(Current, Num, Sleep)
{
	for (var i = 0; i < Num; i++)
	{
		print("#" + (i + 1));
		print("I set, A: " + Current);
		TOU_Measure(Current);
		sleep(Sleep);
	}
}

// Print values (Idut, Ton, Tgd)
function TOU_getVal()
{
	var idut = dev.r(250);
	var tgd = dev.r(251);
	var ton = dev.r(252);

	if (tou_print)
	{
		print("Idut	[A]:  " + idut);
		print("Tgd	[us]: " + (tgd / 1000));
		print("Ton	[us]: " + (ton / 1000));
		print("------------------");
	}
	return { tgd : tgd, ton : ton };
}

// Idut setpoint error, %
function TOU_getError()
{
	var i = dev.r(128);
	var iReal = dev.r(250);
	var error = (100 * (iReal - i) / i).toFixed(2);
	
	if (tou_printError)
	{
		print("Idut error [%]: " + error);
		print("------------------");
	}
	return error;
}
