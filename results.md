# use nginx proxy_cache

## prepare web server

`node-hello` is a web server powered by koajs, listen on 3000 port, and handle `/` delay 1000ms.
you can start it with `docker-compose up -d web`.

## enable proxy_cache in nginx.conf

make sure you have created /tmp/nginx in your container, and change owner to user `nginx`.

```
mkdir -p /tmp/nginx
chown nginx /tmp/nginx
```

```
http {
	...
	proxy_cache_path /tmp/nginx/my_cache levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=1m 
                     use_temp_path=off;

    upstream backend {
        server web:3000;
    }

    server {
        location / {
            proxy_cache my_cache;
            proxy_pass http://backend;
            proxy_ignore_headers Cache-Control;
            proxy_cache_valid 200 1m;

            add_header X-Cache-Status $upstream_cache_status;
            ...
        }
    }
```

## test by `ab` command

```
ab -n 200 -c 4 <your_host_name_or_ip>:8080/
```

## result and conclusion

the first 4 requests will send to backend server, and the left will hit nginx cache, so proxy_cache
module can't prevent duplicated requests before first request has finished.

logs of `ab` test

```
$ ab -n 200 -c 4 <your_host_name_or_ip>:8080/
This is ApacheBench, Version 2.3 <$Revision: 1706008 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 192.168.99.100 (be patient)
Completed 100 requests
Completed 200 requests
Finished 200 requests


Server Software:        nginx/1.11.3
Server Hostname:        192.168.99.100
Server Port:            8080

Document Path:          /
Document Length:        25 bytes

Concurrency Level:      4
Time taken for tests:   1.233 seconds
Complete requests:      200
Failed requests:        0
Total transferred:      40804 bytes
HTML transferred:       5000 bytes
Requests per second:    162.19 [#/sec] (mean)
Time per request:       24.663 [ms] (mean)
Time per request:       6.166 [ms] (mean, across all concurrent requests)
Transfer rate:          32.31 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.1      0       1
Processing:     2   24 143.4      3    1047
Waiting:        2   24 143.4      3    1046
Total:          2   25 143.5      4    1047

Percentage of the requests served within a certain time (ms)
  50%      4
  66%      4
  75%      4
  80%      4
  90%      5
  95%      7
  98%   1005
  99%   1045
 100%   1047 (longest request)
```

logs from backend

```
07:03:18 node-hello-0   <-- GET /
07:03:18 node-hello-0   <-- GET /
07:03:18 node-hello-0   <-- GET /
07:03:18 node-hello-0   <-- GET /
07:03:19 node-hello-0   --> GET / 200 1,011ms 25b
07:03:19 node-hello-0   --> GET / 200 1,012ms 25b
07:03:19 node-hello-0   --> GET / 200 1,022ms 25b
07:03:19 node-hello-0   --> GET / 200 1,021ms 25b
```
