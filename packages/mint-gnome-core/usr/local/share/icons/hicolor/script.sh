cd scalable/apps
for i in *
do
cd ../..
for j in *x*
do
cd $j/apps
ln -s ../../scalable/apps/$i $i
cd ../..
done
cd scalable/apps
done
