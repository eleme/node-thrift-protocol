f() {
  if node $1
  then echo "[32;1m[Done][0m [0;1m$1[0m"
  else echo "[31;1m[Fail][0m [0;1m$1[0m"
  fi
}
for js in $(find $(dirname $0) -name '*.js')
do
  f $js &
done
wait
