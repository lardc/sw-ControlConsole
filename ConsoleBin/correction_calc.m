function correction_calc(Dir, fileInput, fileFlag)
    % read input
    csv_input = dlmread(strcat(pwd, '\', Dir, '\', fileInput, '.csv'), ';');
    % calculate correction
    p = polyfit(csv_input(:, 1), csv_input(:, 2), 1);
    % write output
    f = fopen(strcat(pwd, '\', Dir, '\', fileInput, '_corr.csv'), 'w+');
    fprintf(f, '%e;%e;', p(1), p(2));
    fclose(f);
    % write flag
    f = fopen(strcat(pwd, '\', Dir, '\', fileFlag), 'w+');
    fprintf(f, '%d;', 1);
    fclose(f);
end