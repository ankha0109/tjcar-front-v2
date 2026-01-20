import { AutocompleteCustom } from "@/components/maps/autocomplete-custom";
import AutocompleteResult from "@/components/maps/autocomplete-result";
import { Circle } from "@/components/maps/circle";
import { Modal, useModal } from "@/components/ui/Modal";
import { Colors } from "@/constants/Colors";
import { AttendanceTypes } from "@/enums";
import Api from "@/services/Api";
import {
  AttendanceLocationItemProps,
  AttendanceLocationProps,
  BranchItem,
} from "@/types";
import {
  ArrowDown03Icon,
  Delete02Icon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ControlPosition,
  Map,
  MapControl,
  Marker,
} from "@vis.gl/react-google-maps";
import { App, Button, Form, Input, Slider } from "antd";
import { useEffect, useState } from "react";

const INITIAL_CENTER = { lat: 47.9188364, lng: 106.9179736 };
const INITIAL_RADIUS = 50;
const INITIAL_ZOOM = 13;

const LocationModal = ({
  open,
  setOpen,
  selectedBranch,
  selectedLocationAttendance,
  refetch,
  mode,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedBranch: BranchItem | null;
  selectedLocationAttendance: {
    branch_name: string;
    location: AttendanceLocationItemProps;
  } | null;
  refetch: () => void;
  mode: "create" | "update";
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const { confirm } = useModal();

  // States
  const [saving, setSaving] = useState(false);

  // Google Maps
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [position, setPosition] = useState(INITIAL_CENTER);
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [radius, setRadius] = useState(INITIAL_RADIUS);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.Place | null>(null);

  const radiusWatch = Form.useWatch(["detail", "radius"], form);
  const latitudeWatch = Form.useWatch(["detail", "latitude"], form);
  const longitudeWatch = Form.useWatch(["detail", "longitude"], form);

  useEffect(() => {
    if (radiusWatch !== undefined) {
      setRadius(radiusWatch);
    }
  }, [radiusWatch]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (mode == "create") {
        console.log("-->", selectedBranch, selectedLocationAttendance);
        setMapCenter(INITIAL_CENTER);
        setPosition(INITIAL_CENTER);
        setCenter(INITIAL_CENTER);
        setRadius(INITIAL_RADIUS);
        setZoom(INITIAL_ZOOM);

        form.setFieldsValue({
          branch_id: selectedBranch?.id,
          name: selectedBranch?.name,
          detail: {
            latitude: center.lat,
            longitude: center.lng,
          },
        });
      } else if (mode == "update") {
        const newCenter = {
          lat:
            selectedLocationAttendance?.location?.detail?.latitude ??
            INITIAL_CENTER.lat,
          lng:
            selectedLocationAttendance?.location?.detail?.longitude ??
            INITIAL_CENTER.lng,
        };
        const newRadius =
          selectedLocationAttendance?.location?.detail?.radius ??
          INITIAL_RADIUS;
        setCenter(newCenter);
        setMapCenter(newCenter);
        setRadius(newRadius);
        setPosition(newCenter);
        setZoom(18);

        form.setFieldsValue({
          name: selectedLocationAttendance?.branch_name,
          branch_id: selectedLocationAttendance?.location.branch_id,
          detail: {
            latitude: selectedLocationAttendance?.location?.detail?.latitude,
            longitude: selectedLocationAttendance?.location?.detail?.longitude,
            radius:
              selectedLocationAttendance?.location?.detail?.radius ??
              INITIAL_RADIUS,
          },
        });
      }
    }
  }, [open]);

  const handleCreate = () => {
    form
      .validateFields()
      .then(async (values) => {
        setSaving(true);
        await Api.post(`/company/location`, {
          type: AttendanceTypes.LOCATION,
          ...values,
        })
          .then(() => {
            message.success("Байршил нэмэгдлээ");
            setOpen(false);
            form.resetFields();
            refetch();
          })
          .catch((err) => {
            console.log(err);
            message.error("Алдаа гарлаа.");
          })
          .finally(() => {
            setSaving(false);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleUpdate = () => {
    form
      .validateFields()
      .then(async (values) => {
        setSaving(true);
        await Api.put(
          `/company/location/${selectedLocationAttendance?.location.id}`,
          {
            type: AttendanceTypes.LOCATION,
            ...values,
          }
        )
          .then(() => {
            message.success("Байршил шинэчлэгдлээ");
            setOpen(false);
            form.resetFields();
            refetch();
          })
          .catch((err) => {
            console.log(err);
            message.error("Алдаа гарлаа.");
          })
          .finally(() => {
            setSaving(false);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleDeleteLocation = () => {
    confirm({
      title: "Баталгаажуулах",
      description: "Байршил бүртгэлийг устгах уу?",
      onOk: () => {
        Api.delete(
          `/company/location/${selectedLocationAttendance?.location.id}`
        )
          .then(() => {
            message.success("Байршил бүртгэл устгагдлаа");
            setOpen(false);
            form.resetFields();
            refetch();
          })
          .catch((err) => {
            console.log(err);
            message.error("Алдаа гарлаа.");
          });
      },
    });
  };

  const changeCenter = (newCenter: google.maps.LatLng | null) => {
    if (!newCenter) return;
    setPosition({ lng: newCenter.lng(), lat: newCenter.lat() });
    form.setFieldsValue({
      detail: {
        latitude: newCenter.lat(),
        longitude: newCenter.lng(),
      },
    });
  };

  const handleSelectPlace = (place: google.maps.places.Place | null) => {
    if (!place?.location) return;
    setSelectedPlace(place);

    const newPos = {
      lng: place.location?.lng() ?? 0,
      lat: place.location?.lat() ?? 0,
    };
    setPosition(newPos);
    setCenter(newPos);
    setMapCenter(newPos);
    setZoom(18);

    form.setFieldsValue({
      detail: {
        latitude: place.location?.lat() ?? 0,
        longitude: place.location?.lng() ?? 0,
      },
    });
  };

  return (
    <Modal
      title="Байршлаар цаг бүртгэх"
      open={open}
      centered
      onCancel={() => setOpen(false)}
      onOk={mode === "create" ? handleCreate : handleUpdate}
      okButtonProps={{
        loading: saving,
      }}
      width={{
        xs: "90%",
        sm: "80%",
        md: "70%",
        lg: "1300px",
        xl: "1300px",
        xxl: "1300px",
      }}
      footer={
        <div className="flex gap-3">
          {mode == "update" && (
            <Button
              icon={
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={18}
                  className="flex items-center text-red"
                />
              }
              onClick={handleDeleteLocation}
              className="px-10"
            >
              Устгах
            </Button>
          )}
          <Button
            key="submit"
            loading={saving}
            onClick={mode === "create" ? handleCreate : handleUpdate}
            icon={
              <HugeiconsIcon
                icon={ArrowDown03Icon}
                size={20}
                className="flex items-center text-primary"
              />
            }
            block
          >
            Хадгал
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1 rounded-lg overflow-hidden">
          <Map
            mapId={"49ae42fed52588c3"}
            style={{
              // width: "100vw",
              height: "450px",
            }}
            center={mapCenter}
            onCenterChanged={(e) => setMapCenter(null)}
            zoom={zoom}
            onZoomChanged={(e) => setZoom(e.detail.zoom)}
            gestureHandling={"greedy"}
            disableDefaultUI={true}
            onClick={(e) => {
              const newPos = {
                lat: e.detail?.latLng?.lat ?? 0,
                lng: e.detail?.latLng?.lng ?? 0,
              };
              setPosition(newPos);
              form.setFieldsValue({
                detail: {
                  latitude: newPos.lat,
                  longitude: newPos.lng,
                },
              });
            }}
            fullscreenControl
          >
            <MapControl position={ControlPosition.TOP_LEFT}>
              <AutocompleteCustom onPlaceSelect={handleSelectPlace} />
            </MapControl>
            <AutocompleteResult place={selectedPlace} />
            <Marker
              position={position}
              draggable
              onDrag={(e) => {
                const newPos = {
                  lat: e.latLng?.lat() ?? 0,
                  lng: e.latLng?.lng() ?? 0,
                };
                setPosition(newPos);
                form.setFieldsValue({
                  detail: {
                    latitude: newPos.lat,
                    longitude: newPos.lng,
                  },
                });
              }}
              // onDragEnd={(e) => {
              //   setCenter({
              //     lat: e.latLng?.lat() ?? 0,
              //     lng: e.latLng?.lng() ?? 0,
              //   });
              // }}
            />
            <Circle
              radius={radius}
              center={position}
              // onRadiusChanged={(e) => {
              //   console.log("changed", e);
              //   setRadius(e);
              // }}
              onCenterChanged={changeCenter}
              strokeColor={"#0c4cb3"}
              strokeOpacity={1}
              strokeWeight={2}
              fillColor={Colors.primary}
              fillOpacity={0.2}
              // editable
              draggable
            />
          </Map>
        </div>

        <div>
          <Form
            form={form}
            layout="vertical"
            className="w-[340px] flex flex-col justify-between h-full"
            initialValues={{
              detail: {
                radius: 50,
              },
            }}
          >
            <div>
              <Form.Item name="branch_id" hidden>
                <Input />
              </Form.Item>
              <Form.Item
                name="name"
                label="Цаг бүртгэх байршил"
                rules={[{ required: true, message: "Заавал оруулна уу" }]}
              >
                <Input placeholder="Цаг бүртгэх байршил" readOnly />
              </Form.Item>

              <Form.Item
                name={["detail", "radius"]}
                label={
                  <div className="flex justify-between items-center gap-3">
                    <span>Цаг бүртгэх радиус</span>
                    <span className="text-black">{radius} метр</span>
                  </div>
                }
                rules={[{ required: true, message: "Заавал оруулна уу" }]}
              >
                <Slider
                  step={5}
                  min={10}
                  max={200}
                  onChange={(e) => setRadius(e)}
                />
              </Form.Item>
            </div>

            <div className="flex gap-3">
              <Form.Item
                name={["detail", "latitude"]}
                label="Latitude"
                rules={[{ required: true, message: "Заавал оруулна уу" }]}
                hidden
              >
                <Input readOnly />
              </Form.Item>
              <Form.Item
                name={["detail", "longitude"]}
                label="Longitude"
                rules={[{ required: true, message: "Заавал оруулна уу" }]}
                hidden
              >
                <Input readOnly />
              </Form.Item>

              <div className="mt-4">
                <div className="flex flex-col gap-[20px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500">Өргөрөг:</span>
                    <span className="">{latitudeWatch || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500">Уртраг:</span>
                    <span>{longitudeWatch || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  );
};

export default LocationModal;
