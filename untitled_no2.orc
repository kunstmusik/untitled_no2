;; Untitled - no.2
;; Author: Steven Yi <stevenyi@gmail.com>

sr=48000
ksmps=32
nchnls=2
nchnls_i=1
0dbfs=1

gal init 0
gar init 0


opcode print_array, 0,k[]
  kvals[] xin
  indx init 0

  while (indx < lenarray:i(kvals)) do
    prints("[%d] = %f\n", indx, i(kvals,indx))
    indx += 1
  od

endop

opcode alg0, k[], ik[]
  // rand slice that is rand rotated
  inum, kin[] xin

  ilen = lenarray:i(kin)
  inum = min:i(inum, ilen)
  istart = int(random(0, ilen))

  kvals[] init inum

  indx = 0

  while (indx < inum) do
    kvals[indx] init i(kin, istart)

    istart = (istart + 1) % inum
    indx += 1
  od 

  kout[] init inum
  indx = 0
  iread = int(random(0, inum))

  while (indx < inum) do
    ival = i(kvals, iread)
    kout[indx] init ival 
    iread = (iread + 1) % inum
    indx += 1
  od

  xout kout
endop

opcode play_chord,0,Siik[]i
  Sinstr, idur, ibase, kvals[], iamp xin

  turnoff

  indx = 0
  istart = 0
  while (indx < lenarray:i(kvals)) do
    schedule(Sinstr, istart, idur, cpsmidinn(ibase + i(kvals, indx)), ampdbfs(iamp))
    indx += 1
    istart += random(0.01, 1)
  od

endop

opcode play_chord,0,iiik[]i
  instr_num, idur, ibase, kvals[], iamp xin

  turnoff

  indx = 0
  istart = 0
  while (indx < lenarray:i(kvals)) do
    schedule(instr_num, istart, idur, cpsmidinn(ibase + i(kvals, indx)), ampdbfs(iamp))
    indx += 1
    istart += random(0.01, 1)
  od

endop

opcode choose, i, i
  iamount xin
  ival = 0

  if(random(0,1) < limit:i(iamount, 0, 1)) then
    ival = 1 
  endif
  xout ival
endop

instr 1
  asig = vco2(0.5, p4)
  asig += vco2(0.15, p4 * 1.5)
  asig *= p5
  asig = zdf_ladder(asig, expon(12000, p3, 200), 5)
  gal += asig
  gar += asig
endin

instr Str 
  asig = vco2(0.5, p4)
  asig += vco2(0.15, p4 * 1.5, 10)
  asig *= p5
  asig = zdf_ladder(asig, expseg(400, p3 *.5, 12000, p3 *.5, 400), 5)

  asig *= linseg(0, p3 * .5, 1, p3 * .5, 0)

  al, ar pan2 asig, random:i(0, 1)
  gal += al 
  gar += ar 
endin

opcode rand_symmetric, k[],ik[]
  ihalfnum, kintervals[] xin
  
  itot = ihalfnum * 2  

  kout[] init itot

  indx init 0
  ival init 0
  interval_lens = lenarray:i(kintervals)
  kout[indx] = 0

  while (indx < ihalfnum) do
    interval = i(kintervals, int(rnd(interval_lens)))
    ival += interval 
    kout[indx + 1] init ival
    indx += 1
  od

  while (indx < itot - 1) do
    indx1 = itot - indx - 1
    indx2 = indx1 - 1
    interval = i(kout,indx1) - i(kout, indx2)
    ival += interval 
    kout[indx + 1] init ival
    indx += 1
  od 

  xout kout

endop


/*
print_array(rand_symmetric(4, array(1,2)))
*/


/* 
play_chord("Str", random(15.5, 16), 72, array(0,2,4,5,7,9), -24)
  play_chord("Str", random(15.5, 16), 66, array(0,2,4,5,7,9), -24)
  play_chord("Str", random(15.5, 16), 43, array(0,2,4,5,7,9), -24)
  play_chord("Str", random(15.5, 16), 62, array(0,1,3,5,6,8,10,11), -28)
  play_chord("Str", random(31.5, 32), 48, array(0,1,3,5,6,8,10,11), -28)


  play_chord("Str", random(31.5, 32), 43, rand_symmetric(4, array(1,2,4)), -28)
  play_chord("Str", random(31.5, 32), 73, rand_symmetric(2, array(1,2)), -28)
  play_chord("Str", random(31.5, 32), 60, rand_symmetric(5, array(2,4)), -28)
  play_chord("Str", random(31.5, 32), 57, rand_symmetric(9, array(2,4,5)), -28)

  play_chord("Str", random(31.5, 32), 45, rand_symmetric(3, array(7,5)), -28)


  play_chord("Str", random(31.5, 32), 44, rand_symmetric(8, array(2,4,5)), -28)

  play_chord(1, random(3.5, 4), 57, rand_symmetric(9, array(2,4,5)), -20)
*/

instr Mixer

  al, ar reverbsc gal, gar, 0.87, 4000

  al = ntrpol(al, gal, 0.8)
  ar = ntrpol(ar, gar, 0.8)

  outc(al, ar)

  gal = 0
  gar = 0
endin

instr Runner
  knn[] = array(2,5,7,1)

  ilen = lenarray(knn)
  inum = int(random(1, ilen + 1)) 

  kvals[] alg0 inum, knn 

  indx = 0
  istart = 0

  while (indx < inum) do
    inn = i(kvals, indx)
    print inn

    schedule(1, istart, 
      8, 
      cpsmidinn(72 + inn), 
      ampdbfs(-22))
    if(choose(0.75) == 1) then
      istart += random(2, 4) * 4
    else 
      istart += random(0.25, 1) * 4
    endif

    indx += 1
  od

  schedule(p1, random(8, 14), 1)
endin

seed(0)

schedule("Runner", 0, 1)
schedule("Mixer", 0, -1)
