FROM golang:1.22.10-alpine3.20

RUN printf 'package main\nimport (\n"fmt"\n"os"\n"strings"\n"strconv"\n"sort"\n"math"\n"time"\n"bufio"\n"errors"\n"bytes"\n)\nfunc main(){_=fmt.Sprint;_=os.Args;_=strings.Split;_=strconv.Itoa;_=sort.Ints;_=math.Pi;_=time.Now;_=bufio.NewReader;_=errors.New;_=bytes.NewBuffer}\n' > /tmp/warm.go \
    && GOCACHE=/opt/gocache GO111MODULE=off go build -o /dev/null /tmp/warm.go \
    && rm /tmp/warm.go \
    && chmod -R a+rwX /opt/gocache

USER 65534:65534

WORKDIR /workspace

CMD ["go", "version"]
