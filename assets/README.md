# RadioWitness
Immutable, peer-to-peer archiving and distribution of police radio broadcasts. Authors use [Dat Archives](https://datproject.org/) to record local police radio. Publishers seed archives from authors and then re-distribute them to larger audiances. Other rolse arise, too, such as Editors who produce their own archives while still referencing the original radio archive and author cryptographically.

## Dependencies
Install [node & npm](https://nodejs.org/en/download/) then [rustc & cargo](https://www.rust-lang.org/en-US/install.html) as well. 

## Downloading
This software distribution is itself a Dat Archive, you can get a copy of it by opening [this link](dat://e7d42a711b59fe11ff0779a96e027786d7b1ea653ea8cc591f469e4156ebdc7e) in [Beaker Browser](https://beakerbrowser.com), or from the command line:
```
$ npm install -g dat
$ dat clone dat://e7d42a711b59fe11ff0779a96e027786d7b1ea653ea8cc591f469e4156ebdc7e ./radiowitness
$ cd ./radiowitness
$ chmod +x ./bin/radiowitness
```

## Authoring & Publishing
```
$ ./bin/radiowitness author install
$
$ echo "851162500,851287500,851137500" | ./bin/radiowitness search --rtlargs="-g 26"
> searching 851162500Hz...
> searching 851287500Hz...
> channel found at 851287500Hz
$
$ ./bin/radiowitness author create --lat "30.245016" --lon="-97.788914" --wacn 781833 --sysid 318 --rfssid 1 --siteid 1
> dat://d5a552b19d894844aa18be0c15d6b934e298e9452a9bc4f5d96273e8c1430824
$
$ ./bin/radiowitness publisher install
$ mkfifo /tmp/replication
$
$ ./bin/radiowitness author --radios 3 --mux 2 -f 851287500 -s 1200000 --rtlargs="-g 26" < /tmp/replication | \
    ./bin/radiowitness publisher dat://d5a552b19d894844aa18be0c15d6b934e298e9452a9bc4f5d96273e8c1430824 > /tmp/replication
```

## Audio Synthesis
```
$ ./bin/radiowitness synth install
$ ./bin/radiowitness synth dat://d5a552b19d894844aa18be0c15d6b934e298e9452a9bc4f5d96273e8c1430824
> synth input  -> dat://d5a552b19d894844aa18be0c15d6b934e298e9452a9bc4f5d96273e8c1430824
> synth output -> dat://8a27beb910315fca4024452f7e566b6be07f65be59ec6b03867bdbc1dc1bd1d0
> synth ready, restarting from 300.
$
$ ./bin/radiowitness play dat://8a27beb910315fca4024452f7e566b6be07f65be59ec6b03867bdbc1dc1bd1d0 | \
    play -t raw -b 16 -e signed -r 8k -c 1 -
```

## Audio Indexing
```
$ ./bin/radiowitness indexing install
$ ./bin/radiowitness indexing dat://8a27beb910315fca4024452f7e566b6be07f65be59ec6b03867bdbc1dc1bd1d0
> index input  -> dat://8a27beb910315fca4024452f7e566b6be07f65be59ec6b03867bdbc1dc1bd1d0
> index output -> dat://8f5aa4338db3e276e00fefa552daede159ff3b322c0bdbff1174cb27ab7cd9bd
> index ready, restarting from 120.
```

## Updates
This software distribution can be updated like any other Dat Archive by running the commands `dat sync` or `dat pull`. However, it is recommended that you use the `bin/radiowitness` bash script to check for updates. In addition to updating the Dat Archive the bash script will alert you to relevant release notes as long as someone wrote them ;).
```
$ ./bin/radiowitness update
```

## Development
Rebuild `web/` and generate root `.datignore` file by concatenating all `.gitignore` files found in subdirectories:
```
$ ./bin/radiowitness devstuff
```

## License
License Zero Reciprocal Public License 2.0.1
