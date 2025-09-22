print("1")
import osmnx as ox

ox.settings.useful_tags_way = ox.settings.useful_tags_way + ["surface", "cycleway"]

print("2")
# Define a city or bounding box
place = "Rosemount, Kitchener, Ontario, Canada"

# Download the road network (drivable/cyclable options available)
# For cycling, use network_type="bike"
G = ox.graph_from_place(place, network_type="bike")

# Show a quick plot
# ox.plot_graph(G)

dem_path = "srtm_20_04.tif"

# Assign elevations from raster
G = ox.elevation.add_node_elevations_raster(G, dem_path)

# Add edge grades (slope)
# G = ox.elevation.add_edge_grades(G)

edges = ox.graph_to_gdfs(G, nodes=False, edges=True, fill_edge_geometry=True)

# Look at first few rows
print(edges.columns)
print(edges[["highway", "length", "surface", "cycleway", "maxspeed", "grade", "grade_abs"]].head(25))
