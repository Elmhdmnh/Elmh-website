# UE5 材质笔记：三平面纹理为什么会在移动的模型表面滑动

文章是AI按照对话总结的，我只有略微改动

> 模型没有 UV，只能用 WorldAlignedTexture 做三平面，结果一动就滑。

最近给一个自定义模型做粑粑材质。模型是我拿max手搓的，没有像样的 UV 展开，普通的 `TextureSample` 用不了，于是上了三平面（Triplanar）：用 `WorldAlignedTexture` 和 `WorldAlignedNormal` 两个节点，靠位置和法线自动生成三个方向的投影，接缝和拉伸确实都没有。

但模型一移动，纹理就在表面滑。

## 为什么会滑

`WorldAlignedTexture` / `WorldAlignedNormal` 是**世界对齐**的，它们默认拿 **Absolute World Position（绝对世界位置）** 当采样坐标。相当于把纹理「投影」在固定的世界里：物体从那团纹理里穿过去，表面看起来就是纹理在动。

世界对齐本来就是给地形、建筑、大块岩石这种不动的场景物件用的。会动的物体，采样坐标要换成**物体局部空间**——物体移动时世界坐标一直在变，局部坐标则始终相对物体固定。

## 改法：把采样坐标换成局部空间

思路一句话：把喂给两个 WorldAligned 节点的位置，从世界坐标换成局部坐标。

```text
绝对世界位置 ──→ TransformPosition（源=绝对场景空间，目标=本地空间）─┬→ WorldAlignedTexture · WorldPosition
                                                              └→ WorldAlignedNormal · WorldPosition

顶点法线 ──→ TransformVector（源=世界空间，目标=本地空间）──→ WorldAlignedNormal · Normal
```

四个容易踩的点：

1. **位置要用 `TransformPosition`，不是 `TransformVector`**。TransformVector 只能转方向，拿它转位置坐标，坐标会乱掉，纹理会变成一片纯色。
2. **两个 WorldAligned 节点的 `WorldPosition` 都要接**。只接了颜色那个，法线还是会滑——它空着就默认用世界位置。
3. `WorldAlignedNormal` 的 **`WorldSpace (SB)` 是布尔开关**，控制输出的是世界空间还是切线空间法线，**不是法线输入**。几何法线接的是 `Normal (V3)`。
4. 颜色和法线必须共用**同一个** `TransformPosition` 的输出，否则两套投影对不上。

## 调纹理大小

三平面节点没有 UV 输入，`TexCoord` 没地方接，调大小改 **`TextureSize (V3)`**：

- 数值调大 → 纹理变大（重复变少）
- 数值调小 → 纹理变密（重复变多）

`WorldAlignedTexture` 和 `WorldAlignedNormal` 的 TextureSize 要填一样的值，不然颜色和凹凸会错位。想随时调的话，接一个 `ScalarParameter`。

## 验证

- 平移模型：纹理贴住不动
- 旋转模型：颜色和凹凸跟着一起转，不闪

## 小结

三平面适合没有 UV 的模型，但它按世界空间投影，用在会动的物体上就得手动转成局部空间。另外 `WorldSpace` 那个布尔很容易被当成法线插槽——它根本接不了 V3。

---

参考：

- [Epic 论坛：WorldAlignedNormal 的 WorldSpace 说明](https://forums.unrealengine.com/t/world-aligned-normal-textures-not-working/235175/4)
- [UE5 Triplanar Deep Dive](https://80.lv/articles/ue5-triplanar-deep-dive-from-worldalignedtexture-to-high-quality-normals-part-1)
