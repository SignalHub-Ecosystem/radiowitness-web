# RadioWitness
Immutable, peer-to-peer archiving and distribution of police radio calls. Authors use [Software-Defined Radios](https://sdr.osmocom.org/trac/wiki/rtl-sdr) and [Dat Archives](https://datproject.org/) to record local police radio. Publishers seed archives from Authors and then re-distribute them to larger audiances. Other rolse arise too, such as Studios who synthesize radio archives into archives of audible speech, and Indexers who aggregate metadata on individual radio calls. Stop by [#radiowitness on freenode](https://webchat.freenode.net/) and say hi.

## Dependencies
Install [node & npm](https://nodejs.org/en/download/) then [rustc & cargo](https://www.rust-lang.org/en-US/install.html) as well. 

## Downloading
This software distribution is itself a Dat Archive, you can get a copy of it by opening [this link](dat://cda26788102ec1e166b72f2ed685f4dd1480c59189c03f23c253b822200fc152) in [Beaker Browser](https://beakerbrowser.com), or from the command line:
```
$ npm install -g dat
$ dat clone dat://cda26788102ec1e166b72f2ed685f4dd1480c59189c03f23c253b822200fc152 ./radiowitness
$ cd ./radiowitness
$ chmod +x ./bin/radiowitness
```

## Authoring & Publishing
The [Dat Protocol](https://www.datprotocol.com/) is transport agnostic, meaning Dat peers can communicate over TCP, UDP, any duplex stream really. This flexibility allows Publishers to provide any number of peering strategies to their Authors. In practice a UDP socket on a well-routed VPS is a fine start, add [WireGuard VPN](https://www.wireguard.com/) and you'll be feeling like the king of Nynex. Both Author and Publisher peers will attempt to use `stdin&stdout` to replicate so you've just gotta pipe them together using your transport of choice, in this example a linux fifo:
```
$ ./bin/radiowitness author install
$
$ echo "851162500,851287500,851137500" | ./bin/radiowitness search --rtlargs="-g 26"
> searching 851162500Hz...
> searching 851287500Hz...
> channel found at 851287500Hz
$
$ ./bin/radiowitness author create --lat "30.245016" --lon="-97.788914" --wacn 781833 --sysid 318 --rfssid 1 --siteid 1
> dat://a776a2743a32a8706412d48693348259f08bea7e1ecf13a23491ded68c9419ea
$
$ ./bin/radiowitness publisher install
$ mkfifo /tmp/replication
$
$ ./bin/radiowitness author --radios 3 --mux 2 -f 851287500 -s 1200000 --rtlargs="-g 26" < /tmp/replication | \
    ./bin/radiowitness publisher dat://a776a2743a32a8706412d48693348259f08bea7e1ecf13a23491ded68c9419ea > /tmp/replication
```

## Audio Synthesis
Police radio is unlike the radio you hear from a car or boombox because it travels through the airwaves in a compressed form, all this means is that we've got to do an extra step to get something audible out of it. This extra step is intentionally left behind by both Author and Publisher peers because the *raw* radio archive has importance in and of itself. The Studio peer reads a radio archive as input and produces an audio archive as output:
```
$ ./bin/radiowitness studio install
$ ./bin/radiowitness studio dat://a776a2743a32a8706412d48693348259f08bea7e1ecf13a23491ded68c9419ea
> studio input  -> dat://a776a2743a32a8706412d48693348259f08bea7e1ecf13a23491ded68c9419ea
> studio output -> dat://3cd790e16b4f22464b4e3045a2c5c328631d5c124d084609b6c0571cce766f49
> studio ready, restarting from 300.
$
$ ./bin/radiowitness play dat://3cd790e16b4f22464b4e3045a2c5c328631d5c124d084609b6c0571cce766f49 | \
    play -t raw -b 16 -e signed -r 8k -c 1 -
```

## Audio Indexing
The archives created by Studios are basically giant, ever-growing [.WAV audio files](https://en.wikipedia.org/wiki/WAV) with a handful of extra metadata thrown in. Studio archives are great for streaming live, but to really explore years worth of audio some search indexes are needed. Indexing reads an audio archive as input and produces a [hyperdb](https://github.com/mafintosh/hyperdb) as output with calls batched by hours-since-unix-epoch at keys with the form `/calls/{epoch-hour}/{callid}`:
```
$ ./bin/radiowitness indexing install
$ ./bin/radiowitness indexing dat://3cd790e16b4f22464b4e3045a2c5c328631d5c124d084609b6c0571cce766f49
> index input  -> dat://3cd790e16b4f22464b4e3045a2c5c328631d5c124d084609b6c0571cce766f49
> index output -> dat://4fe9db8829fa299d9133f18b7ff5ada855b132075a7cdf1369ff5c1c59fa22ce
> index ready, restarting from 120.
```

## Updates
This software distribution can be updated like any other Dat Archive by running the commands `dat sync` or `dat pull`. However, it is recommended that you use the `bin/radiowitness` bash script to check for updates. In addition to updating, the bash script will alert you to relevant release notes as long as someone wrote them ;).
```
$ ./bin/radiowitness update
```

## Standards & Conventions
Different peers author different types of data and so we need to introduce a little structure. All peer types operate on [hypercores](https://github.com/mafintosh/hypercore) with the exception of *Indexer* who's output is a [hyperdb](https://github.com/mafintosh/hyperdb). Hypercores are an append-only log structure and we use record `0` within the log as a sort of header. HyperDB is a magic P2P key-value store and we put a sort-of-header at key `/rw-about`.

### rw-author hypercore record `0`
```
{
  "version" : 1,
  "type" : "rw-author",
  "tags" : {
    "geo" : { "lat" : 4.20, "lon" : 6.66 },
    "network" : { "wacn" : 1, "sysid" : 1, "rfssid" : 1, "siteid" : 1 }
  }
}
```

### rw-studio hypercore record `0`
Notice how `links` is used to reference the input hypercore:
```
{
  "version" : 1,
  "type" : "rw-studio",
  "links" : {
    "author" : [{ "type" : "rw-author", "href" : "dat://abc123" }]
  },
  "tags" : {
    "geo" : { "lat" : 4.20, "lon" : 6.66 },
    "network" : { "wacn" : 1, "sysid" : 1, "rfssid" : 1, "siteid" : 1 }
  }
}
```

### rw-studio-index hyperdb key `/rw-about`
Notice how `links` is used to reference both the original radio hypercore and the audio hypercore produced by a `rw-studio` peer:
```
{
  "version" : 1,
  "type" : "rw-studio-index",
  "links" : {
    "author" : [{ "type" : "rw-author", "href" : "dat://abc123" }]
    "author" : [{ "type" : "rw-studio", "href" : "dat://def456" }]
  },
  "tags" : {
    "geo" : { "lat" : 4.20, "lon" : 6.66 },
    "network" : { "wacn" : 1, "sysid" : 1, "rfssid" : 1, "siteid" : 1 }
  }
}
```

### rw-publisher `dat.json`
The idea here is to build upon the existing Beaker Browser [dat.json spec](https://beakerbrowser.com/docs/apis/manifest) as much as possible. In this way Publishers can use a [Dat Website](https://beakerbrowser.com/docs/how-beaker-works/peer-to-peer-websites) as the front page of their P2P presence while seeding their Author's archives in a structured, discoverable way.
```
{
  "type" : ["website", "rw-publisher"],
  "title" : "Radio Venceremos",
  "description" : "we shall overcome",
  "links" : {
    "author" : [
      { "type" : "rw-author", "href" : 'dat://abc123' },
      { "type" : "rw-studio", "href" : 'dat://def456' },
      { "type" : "rw-studio-index", "href" : 'dat://ghi789' }
    ]
  }
}
```

## Development
Making this up as we go. Rebuild `web/` and generate root `.datignore` file by concatenating all `.gitignore` files found in subdirectories:
```
$ ./bin/radiowitness devstuff
```

## License
License Zero Reciprocal Public License 2.0.1
