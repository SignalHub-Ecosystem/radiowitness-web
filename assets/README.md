# RadioWitness
Immutable, peer-to-peer archiving and distribution of police radio broadcasts. Authors use [Dat archives](https://datproject.org/) to record local police radio. Publishers seed Dat archives from authors and then re-distribute them to larger audiances. Other rolse arise, too, such as Editors who produce their own archives while still referencing the original radio archive and author cryptographically.

## Dependencies
Install [node & npm](https://nodejs.org/en/download/) then [rustc & cargo](https://www.rust-lang.org/en-US/install.html) as well. 

## Downloading
This software distrobution is itself a Dat Archive, you can get a copy of it by opening [this link](dat://e7d42a711b59fe11ff0779a96e027786d7b1ea653ea8cc591f469e4156ebdc7e) in [Beaker Browser](https://beakerbrowser.com), or from the command line:
```
$ npm install -g dat
$ dat clone dat://e7d42a711b59fe11ff0779a96e027786d7b1ea653ea8cc591f469e4156ebdc7e ./radiowitness
$ cd ./radiowitness
```

## Authoring & Publishing
```
$ chmod +x ./bin/radiowitness
$ ./bin/radiowitness install author
$
$ echo "851162500,851287500,851137500" | ./bin/radiowitness search --rtlargs="-g 26"
> searching 851162500Hz...
> searching 851287500Hz...
> channel found at 851287500Hz
$
$ ./bin/radiowitness create --wacn 781833 --sysid 318 --rfssid 1 --siteid 1
> dat://058fdc74a1c94476b1ea3cf186f98ff6c1575dac007c9530b8c986dda86b9447
$
$ ./bin/radiowitness install publisher
$ mkfifo /tmp/replication
$
$ ./bin/radiowitness author --radios 3 --mux 2 -f 851287500 -s 1200000 --rtlargs="-g 26" < /tmp/replication | \
    ./bin/radiowitness publish dat://058fdc74a1c94476b1ea3cf186f98ff6c1575dac007c9530b8c986dda86b9447 > /tmp/replication
```

## Audio Synthesis
```
$ ./bin/radiowitness install synth
$ ./bin/radiowitness synth dat://058fdc74a1c94476b1ea3cf186f98ff6c1575dac007c9530b8c986dda86b9447
> synth input  -> dat://058fdc74a1c94476b1ea3cf186f98ff6c1575dac007c9530b8c986dda86b9447
> synth output -> dat://acae2beef9301a805d64a3996d3e6202b729153ff2071e449fd18590f83ed77f
> synth ready.
$
$ ./bin/radiowitness play dat://acae2beef9301a805d64a3996d3e6202b729153ff2071e449fd18590f83ed77f | \
    play -t raw -b 16 -e signed -r 8k -c 1 -
```

## Update
```
$ dat sync
```

## Development
Generate root `.datignore` file by concatenating all `.gitignore` files found in subdirectories:
```
$ ./bin/radiowitness ignore
```

## License
License Zero Reciprocal Public License 2.0.1
