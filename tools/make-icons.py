#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make-icons.py —— 图标生成工具（零依赖，仅用 Python 标准库）

用法：
    python tools/make-icons.py

功能：
    1. 用无头 Chrome 把 img/icon.svg / img/icon-maskable.svg 渲染成 512×512 PNG
    2. 纯 Python 实现 PNG 解码（含 PNG 滤波还原）→ 区域平均缩放 → PNG 编码，
       产出 192 / 180 等小尺寸图，供 favicon / apple-touch-icon / manifest 使用
    3. 输出清单：
       img/icon-512.png            标准图标（圆角+绶带，用于 any）
       img/icon-192.png
       img/icon-180.png            = apple-touch-icon.png（iOS 主屏）
       img/icon-maskable-512.png   安卓自适应（maskable，安全区内容）
       img/icon-maskable-192.png
"""
import os
import struct
import subprocess
import sys
import tempfile
import zlib

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 项目根
IMG = os.path.join(HERE, 'img')
CHROME_CANDIDATES = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
]
SIZES = [512, 192, 180]


# ---------------------------------------------------------------- PNG 读取
def read_png(path):
    data = open(path, 'rb').read()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('not a png: ' + path)
    pos, idat, ihdr, plte = 8, b'', None, None
    while pos < len(data):
        ln = struct.unpack('>I', data[pos:pos + 4])[0]
        typ = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + ln]
        pos += 12 + ln
        if typ == b'IHDR':
            ihdr = struct.unpack('>IIBBBBB', chunk)
        elif typ == b'IDAT':
            idat += chunk
        elif typ == b'PLTE':
            plte = chunk
        elif typ == b'IEND':
            break
    w, h, depth, ct, comp, filt, inter = ihdr
    if depth != 8 or inter != 0:
        raise ValueError('unsupported png (depth=%s interlace=%s)' % (depth, inter))
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ct]
    raw = zlib.decompress(idat)
    stride = w * channels
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]
        p += 1
        line = bytearray(raw[p:p + stride])
        p += stride
        if f == 1:
            for i in range(channels, stride):
                line[i] = (line[i] + line[i - channels]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - channels] if i >= channels else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - channels] if i >= channels else 0
                b = prev[i]
                c = prev[i - channels] if i >= channels else 0
                pp = a + b - c  # 注意：不要命名为 p，会覆盖外层的字节位置游标
                pa, pb, pc = abs(pp - a), abs(pp - b), abs(pp - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    # 调色板 → RGBA
    if ct == 3:
        rgba = bytearray(w * h * 4)
        for i in range(w * h):
            idx = out[i] * 3
            rgba[i * 4:i * 4 + 3] = plte[idx:idx + 3]
            rgba[i * 4 + 3] = 255
        return w, h, 4, bytes(rgba)
    # 灰度 → RGBA 简化处理（本工具用不到，仅兜底）
    if ct == 0:
        rgba = bytearray(w * h * 4)
        for i in range(w * h):
            rgba[i * 4:i * 4 + 3] = bytes([out[i]] * 3)
            rgba[i * 4 + 3] = 255
        return w, h, 4, bytes(rgba)
    if ct == 4:  # 灰度+alpha → RGBA
        rgba = bytearray(w * h * 4)
        for i in range(w * h):
            g, a = out[i * 2], out[i * 2 + 1]
            rgba[i * 4:i * 4 + 3] = bytes([g] * 3)
            rgba[i * 4 + 3] = a
        return w, h, 4, bytes(rgba)
    return w, h, channels, bytes(out)


# ---------------------------------------------------------------- PNG 写入
def write_png(path, w, h, channels, buf):
    ct = {1: 0, 3: 2, 4: 6}[channels]
    stride = w * channels
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter: none
        raw += buf[y * stride:(y + 1) * stride]

    def chunk(t, d):
        return (struct.pack('>I', len(d)) + t + d +
                struct.pack('>I', zlib.crc32(t + d) & 0xffffffff))

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, ct, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    open(path, 'wb').write(png)


# ---------------------------------------------------------------- 缩放（预乘 alpha 的区域平均）
def resize(sw, sh, ch, buf, dw, dh):
    out = bytearray(dw * dh * ch)
    has_a = (ch == 4)
    sx, sy = sw / dw, sh / dh
    for j in range(dh):
        y0, y1 = j * sy, (j + 1) * sy
        iy0, iy1 = int(y0), min(sh - 1, int(y1 - 1e-9))
        for i in range(dw):
            x0, x1 = i * sx, (i + 1) * sx
            ix0, ix1 = int(x0), min(sw - 1, int(x1 - 1e-9))
            acc = [0.0] * ch
            wsum = 0.0
            for yy in range(iy0, iy1 + 1):
                wy = min(y1, yy + 1) - max(y0, yy)
                if wy <= 0:
                    continue
                for xx in range(ix0, ix1 + 1):
                    wx = min(x1, xx + 1) - max(x0, xx)
                    if wx <= 0:
                        continue
                    ww = wx * wy
                    wsum += ww
                    base = (yy * sw + xx) * ch
                    if has_a:
                        a = buf[base + 3] / 255.0 * ww
                        acc[0] += buf[base] * a
                        acc[1] += buf[base + 1] * a
                        acc[2] += buf[base + 2] * a
                        acc[3] += buf[base + 3] * ww
                    else:
                        for c in range(ch):
                            acc[c] += buf[base + c] * ww
            o = (j * dw + i) * ch
            if has_a:
                if acc[3] > 0.5:
                    inv = 255.0 / acc[3]
                    out[o] = min(255, int(round(acc[0] * inv)))
                    out[o + 1] = min(255, int(round(acc[1] * inv)))
                    out[o + 2] = min(255, int(round(acc[2] * inv)))
                out[o + 3] = min(255, int(round(acc[3] / wsum)))
            elif wsum > 0:
                for c in range(ch):
                    out[o + c] = min(255, int(round(acc[c] / wsum)))
    return out


# ---------------------------------------------------------------- 主流程
def find_chrome():
    for p in CHROME_CANDIDATES:
        if os.path.exists(p):
            return p
    raise SystemExit('未找到 Chrome/Edge，请把浏览器路径加进 CHROME_CANDIDATES')


def shoot(chrome, svg, dst):
    url = 'file:///' + svg.replace('\\', '/')
    cmd = [chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars',
           '--default-background-color=00000000', '--force-device-scale-factor=1',
           '--virtual-time-budget=1500', '--window-size=512,512',
           '--screenshot=' + dst, url]
    subprocess.run(cmd, capture_output=True, timeout=60)
    if not os.path.exists(dst) or os.path.getsize(dst) < 1000:
        raise SystemExit('截图失败: ' + svg)


def chain(src_png, base, ch, buf):
    """512 → 各档位缩放并落盘"""
    for size in SIZES:
        if size == 512:
            continue
        out = resize(512, 512, ch, buf, size, size)
        dst = os.path.join(IMG, '%s-%d.png' % (base, size))
        write_png(dst, size, size, ch, out)
        print('  ✓ %s' % os.path.relpath(dst, HERE))


def main():
    chrome = find_chrome()
    tmp = tempfile.mkdtemp(prefix='taxicon_')
    jobs = [
        ('icon.svg', 'icon'),
        ('icon-maskable.svg', 'icon-maskable'),
    ]
    for svg_name, base in jobs:
        svg = os.path.join(IMG, svg_name)
        png512 = os.path.join(tmp, base + '-512.png')
        print('渲染 %s → 512px ...' % svg_name)
        shoot(chrome, svg, png512)
        w, h, ch, buf = read_png(png512)
        if (w, h) != (512, 512):
            raise SystemExit('%s 尺寸异常: %dx%d' % (svg_name, w, h))
        final512 = os.path.join(IMG, base + '-512.png')
        write_png(final512, w, h, ch, buf)
        print('  ✓ %s' % os.path.relpath(final512, HERE))
        chain(png512, base, ch, buf)

    # iOS 主屏图标 = 180 档
    src = os.path.join(IMG, 'icon-180.png')
    dst = os.path.join(IMG, 'apple-touch-icon.png')
    open(dst, 'wb').write(open(src, 'rb').read())
    print('  ✓ %s' % os.path.relpath(dst, HERE))
    print('全部图标已生成。')


if __name__ == '__main__':
    main()
